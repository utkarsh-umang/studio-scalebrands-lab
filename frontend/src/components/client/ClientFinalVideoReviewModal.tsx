import { useMemo, useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DriveOrStreamVideo } from '@/components/drive/DriveOrStreamVideo'
import { QaCommentThread } from '@/components/drive/QaCommentThread'
import { StudioModalShell } from '@/components/StudioModalShell'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'
import { VideoDeliverableReviewPanel } from '@/components/VideoDeliverableReviewPanel'
import { videoNeedsClientFinalReview } from '@/lib/clientBoard'
import type { DeliverableSidebarRow } from '@/lib/deliverableSidebar'
import { buildClientFinalReviewSidebarRows } from '@/lib/deliverableSidebar'
import {
  deliverableIndexForTicket,
  formatSyncedAt,
  getManifestForBatch,
  reloadDriveManifestForBatch,
} from '@/lib/driveMedia'
import { qaPortraitChromeClass, qaPortraitPlayerBoxClass, qaPortraitVideoInnerClass } from '@/lib/qaVideoPortrait'
import { flagsToQaComments, generalFromComments, markersFromComments } from '@/lib/qaComments'
import type { AppTheme } from '@/theme/types'

function clientFinalRowStatus(row: DeliverableSidebarRow): string {
  if (!row.ticket) return 'New on Drive — no ticket yet'
  const t = row.ticket
  if (videoNeedsClientFinalReview(t)) return 'Needs your review'
  const stage = t.stageLabel.toLowerCase()
  if (t.owner === 'editor' && stage.includes('qa flagged')) return 'Editor addressing feedback'
  if (t.owner === 'smm' && stage.includes('qa')) return 'Scale Brands QA'
  if (stage.includes('thumbnail')) return 'Thumbnail review'
  if (t.owner === 'editor') return 'With editor'
  if (t.owner === 'done' || stage.includes('scheduling')) return 'Scheduling / done'
  return t.stageLabel
}

type Props = {
  batch: AdminBatchFolder
  batchTitle: string
  batchTickets: AdminVideoTicket[]
  initialTicket: AdminVideoTicket
  fallbackVideoSrc: string
  theme: AppTheme
  onClose: () => void
  onApprove: (videoId: string) => void
  onReject: (videoId: string, feedback: VideoReviewFeedback) => void
}

export function ClientFinalVideoReviewModal({
  batch,
  batchTitle,
  batchTickets,
  initialTicket,
  fallbackVideoSrc,
  theme,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const [manifestSnapshot, setManifestSnapshot] = useState<
    ReturnType<typeof getManifestForBatch> | undefined
  >(undefined)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const manifest = manifestSnapshot ?? getManifestForBatch(batch.id)
  const manifestVideos = manifest?.videos

  const rows = useMemo(
    () => buildClientFinalReviewSidebarRows(batch.id, manifestVideos, batchTickets),
    [batch.id, manifestVideos, batchTickets],
  )

  const initialIndex = deliverableIndexForTicket(initialTicket)
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)

  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  const selectedRow =
    rows.find((r) => r.index === selectedIndex) ?? rows[0] ?? null

  async function handleSyncFromDrive() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const next = await reloadDriveManifestForBatch(batch.id)
      if (next) {
        setManifestSnapshot(next)
      } else {
        setSyncMessage('No manifest for this batch yet.')
      }
    } catch {
      setSyncMessage('Could not reload manifest — try refreshing the page.')
    } finally {
      setSyncing(false)
    }
  }

  const headerMeta = manifest ? (
    <>
      Last synced {formatSyncedAt(manifest.syncedAt)}
      {manifest.unmapped.length > 0 && (
        <span className="text-destructive">
          {' '}
          · {manifest.unmapped.length} unmapped file(s)
        </span>
      )}
    </>
  ) : (
    'No Drive manifest loaded.'
  )

  const headerAside =
    folderUrl ? (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            void handleSyncFromDrive()
          }}
          disabled={syncing}
          className="border-border bg-muted/30 hover:border-primary/35 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden />
          Sync from Drive
        </button>
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors"
        >
          Go to Drive
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
      </div>
    ) : null

  const qaTicket = selectedRow?.ticket
  const canAct = qaTicket ? videoNeedsClientFinalReview(qaTicket) : false

  const history = qaTicket ? flagsToQaComments(qaTicket, 'video') : []
  const qaCommentHistory = qaTicket?.qaCommentHistory ?? []
  const initialMarkers =
    qaCommentHistory.length > 0
      ? markersFromComments(qaCommentHistory)
      : (qaTicket?.qaFlags?.map((f) => ({ at: f.atSeconds, text: f.note })) ?? [])
  const initialGeneral =
    qaCommentHistory.length > 0
      ? generalFromComments(qaCommentHistory)
      : (qaTicket?.qaGeneralNote ?? '')

  const driveFileId = selectedRow?.entry?.driveFileId
  const fileName = selectedRow?.entry?.name

  return (
    <StudioModalShell
      title="Final video review"
      subtitle={batchTitle}
      titleId="client-final-video-modal-title"
      headerAside={headerAside}
      headerMeta={headerMeta}
      onClose={onClose}
    >
      {!folderUrl ? (
        <p className="text-muted-foreground text-sm">
          Deliverables folder is not linked for this batch yet.
        </p>
      ) : rows.length === 0 ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nothing is in your final video review queue right now. New releases will appear here after
            internal QA — try <strong className="text-foreground">Sync from Drive</strong> if you expect
            new files.
          </p>
          <button
            type="button"
            onClick={() => {
              void handleSyncFromDrive()
            }}
            disabled={syncing}
            className="border-border inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"
          >
            <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} aria-hidden />
            Sync from Drive
          </button>
          {syncMessage ? (
            <p className="text-destructive text-xs leading-relaxed">{syncMessage}</p>
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {syncMessage ? (
            <p className="text-destructive mb-3 shrink-0 text-xs">{syncMessage}</p>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row md:gap-4">
            <aside className="border-border bg-muted/15 flex max-h-[min(32vh,260px)] shrink-0 flex-col rounded-xl border pt-2 md:max-h-none md:w-56 md:bg-transparent md:pt-0">
              <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 md:px-0 md:pb-0">
                {rows.map((row) => {
                  const active = row.index === selectedRow?.index
                  const status = clientFinalRowStatus(row)
                  const needsYou = row.ticket ? videoNeedsClientFinalReview(row.ticket) : false
                  return (
                    <li key={row.index}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIndex(row.index)
                        }}
                        className={[
                          'flex w-full flex-col rounded-lg px-2 py-2 text-left text-xs transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : needsYou
                              ? 'bg-muted/40 hover:bg-muted/55 ring-primary/25 text-foreground ring-1'
                              : 'bg-muted/25 hover:bg-muted/45 text-foreground',
                        ].join(' ')}
                      >
                        <span className="font-semibold tabular-nums">Video {row.index}</span>
                        <span
                          className={[
                            'mt-0.5 line-clamp-2 font-normal opacity-90',
                            active ? 'text-primary-foreground/85' : 'text-muted-foreground',
                          ].join(' ')}
                          title={row.entry?.name ?? row.ticket?.title}
                        >
                          {row.entry?.name ?? row.ticket?.title ?? '—'}
                        </span>
                        <span
                          className={[
                            'mt-1 text-[10px] font-medium uppercase tracking-wide',
                            active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                          ].join(' ')}
                        >
                          {status}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>

            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pr-1">
              {!selectedRow ? (
                <p className="text-muted-foreground text-sm">Select a video.</p>
              ) : !canAct ? (
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                  <div
                    className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950"
                    role="status"
                  >
                    {qaTicket
                      ? 'This deliverable is not waiting on your video approval right now. You can still preview it.'
                      : 'No Studio ticket for this numbered video yet — preview only.'}
                  </div>
                  {history.length > 0 && (
                    <QaCommentThread comments={history} heading="Earlier feedback" />
                  )}
                  {driveFileId ? (
                    <DriveOrStreamVideo
                      driveFileId={driveFileId}
                      fileName={fileName}
                      layout="portrait"
                    />
                  ) : (
                    <div
                      className={qaPortraitChromeClass}
                      style={{ boxShadow: `0 12px 40px -12px ${theme.colors.primary}22` }}
                    >
                      <div className={qaPortraitPlayerBoxClass} dir="ltr">
                        <video
                          className={qaPortraitVideoInnerClass}
                          controls
                          playsInline
                          preload="metadata"
                          src={fallbackVideoSrc}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  key={qaTicket!.id}
                  className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden"
                >
                  {history.length > 0 ? (
                    <div className="max-h-[min(28vh,220px)] shrink-0 overflow-y-auto">
                      <QaCommentThread comments={history} heading="Earlier feedback" />
                    </div>
                  ) : null}
                  <VideoDeliverableReviewPanel
                    className="min-h-0 min-w-0"
                    driveFileId={driveFileId}
                    videoSrc={driveFileId ? undefined : fallbackVideoSrc}
                    fileName={fileName}
                    introText=""
                    theme={theme}
                    commentsHeading="Your feedback"
                    initialMarkers={initialMarkers}
                    initialGeneralNote={initialGeneral}
                    rejectLabel="Request changes"
                    onApprove={() => {
                      onApprove(qaTicket!.id)
                    }}
                    onReject={(feedback) => {
                      onReject(qaTicket!.id, feedback)
                    }}
                  />
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </StudioModalShell>
  )
}
