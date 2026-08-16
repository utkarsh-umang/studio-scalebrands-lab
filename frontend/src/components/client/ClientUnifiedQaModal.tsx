import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { SAMPLE_VIDEO_SRC } from '@/lib/sampleVideoSrc'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { DeliverableSidebarList } from '@/components/drive/DeliverableSidebarList'
import { StudioModalShell } from '@/components/StudioModalShell'
import {
  DeliverableSummaryPanel,
  DriveSyncButton,
  DriveSyncMeta,
  QaCommentWorkspace,
} from '@/components/path-b'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'
import type { DeliverableSidebarRow } from '@/lib/deliverableSidebar'
import { buildClientFinalReviewSidebarRows } from '@/lib/deliverableSidebar'
import { videoNeedsClientFinalReview } from '@/lib/clientBoard'
import { deliverableIndexForTicket, getMediaEntry } from '@/lib/driveMedia'
import { readinessForDeliverable } from '@/lib/pathBDeliverables'
import { flagsToQaComments } from '@/lib/qaComments'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'
import { ClientTitleField } from '@/components/client/ClientTitleField'
import { studioMediaSlot } from '@/lib/studioMedia'

function clientQaRowStatus(row: DeliverableSidebarRow): string {
  if (!row.ticket) return 'Preview only'
  const t = row.ticket
  if (videoNeedsClientFinalReview(t)) return 'Needs your QA'
  if (t.owner === 'smm') return 'With SMM'
  if (t.owner === 'editor') return 'With editor'
  if (t.owner === 'scheduling' || t.owner === 'done') return 'Scheduling'
  return t.stageLabel
}

type Props = {
  batch: AdminBatchFolder
  batchTitle: string
  batchTickets: AdminVideoTicket[]
  initialTicket: AdminVideoTicket
  open: boolean
  onClose: () => void
  onApprove: (videoId: string) => void
  onReject: (videoId: string, feedback: VideoReviewFeedback) => void
  onAddComment?: (videoId: string, body: string) => void
}

export function ClientUnifiedQaModal({
  batch,
  batchTitle,
  batchTickets,
  initialTicket,
  open,
  onClose,
  onApprove,
  onReject,
  onAddComment,
}: Props) {
  const { manifest, syncing, error, sync } = useDriveManifestSync(
    batch.id,
    open ? initialTicket.id : undefined,
  )
  const [view, setView] = useState<'summary' | 'qa'>('summary')

  const rows = useMemo(
    () => buildClientFinalReviewSidebarRows(batch.id, manifest?.videos, batchTickets),
    [batch.id, manifest?.videos, batchTickets],
  )

  const initialIndex = deliverableIndexForTicket(initialTicket)
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)

  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''
  const selectedRow =
    rows.find((r) => r.index === selectedIndex) ?? rows[0] ?? null
  const qaTicket = selectedRow?.ticket
  const canAct = qaTicket ? videoNeedsClientFinalReview(qaTicket) : false
  const deliverableIndex = selectedRow?.index ?? deliverableIndexForTicket(initialTicket)

  const history = qaTicket ? flagsToQaComments(qaTicket, 'video') : []
  const videoEntry = selectedRow?.entry
  const thumbEntry =
    manifest?.thumbnails.find((t) => t.index === deliverableIndex) ??
    getMediaEntry(batch.id, 'thumbnails', deliverableIndex)
  const studioVideo = studioMediaSlot(qaTicket, 'video')
  const studioThumbnail = studioMediaSlot(qaTicket, 'thumbnail')

  const readiness = useMemo(
    () => readinessForDeliverable(batch.id, deliverableIndex, qaTicket, manifest),
    [batch.id, deliverableIndex, qaTicket, manifest],
  )

  if (!open) return null

  const headerAside = folderUrl ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <DriveSyncButton
        onSync={() => {
          void sync()
        }}
        syncing={syncing}
      />
      <a
        href={folderUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors"
      >
        Deliverables folder
        <ExternalLink className="size-3.5 opacity-70" aria-hidden />
      </a>
    </div>
  ) : null

  return (
    <StudioModalShell
      title="Client QA"
      subtitle={`${batchTitle} · Video #${deliverableIndex}`}
      titleId="client-unified-qa-title"
      onClose={onClose}
      headerAside={headerAside}
      headerMeta={<DriveSyncMeta manifest={manifest} errorMessage={error} />}
      bodyScroll
    >
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Nothing is in your review queue for this batch right now.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <DeliverableSidebarList
              rows={rows.map((row) => ({
                index: row.index,
                label: row.entry?.name ?? row.ticket?.title ?? '—',
                statusText: clientQaRowStatus(row),
                highlighted: row.ticket ? videoNeedsClientFinalReview(row.ticket) : false,
              }))}
              selectedIndex={selectedRow?.index ?? null}
              onSelect={(index) => {
                setSelectedIndex(index)
                setView('summary')
              }}
            />

            <main className="flex min-w-0 flex-1 flex-col gap-4 pr-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('summary')
                  }}
                  className={[
                    'rounded-lg px-3 py-1.5 text-xs font-semibold',
                    view === 'summary'
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground border',
                  ].join(' ')}
                >
                  Deliverables
                </button>
                {canAct ? (
                  <button
                    type="button"
                    onClick={() => {
                      setView('qa')
                    }}
                    className={[
                      'rounded-lg px-3 py-1.5 text-xs font-semibold',
                      view === 'qa'
                        ? 'bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground border',
                    ].join(' ')}
                  >
                    QA workspace
                  </button>
                ) : null}
              </div>

              {view === 'summary' || !canAct ? (
                <DeliverableSummaryPanel
                  batch={batch}
                  deliverableIndex={deliverableIndex}
                  ticket={qaTicket}
                  manifest={manifest}
                  readiness={readiness}
                  defaultOpenSections={[]}
                  onSyncDrive={() => {
                    void sync()
                  }}
                  driveSyncing={syncing}
                />
              ) : (
                <QaCommentWorkspace
                  role="client"
                  videoTitle={qaTicket!.title}
                  deliverableIndex={deliverableIndex}
                  comments={history}
                  videoDriveFileId={videoEntry?.driveFileId}
                  videoAssetId={studioVideo?.assetId}
                  videoFileName={studioVideo?.name ?? videoEntry?.name}
                  fallbackVideoSrc={studioVideo ? undefined : SAMPLE_VIDEO_SRC}
                  thumbnailDriveFileId={thumbEntry?.driveFileId}
                  thumbnailAssetId={studioThumbnail?.assetId}
                  thumbnailFileName={studioThumbnail?.name ?? thumbEntry?.name}
                  displayVideoTitle={
                    qaTicket?.editorPublishTitle?.trim() || qaTicket?.title
                  }
                  onAddComment={
                    onAddComment
                      ? (body) => {
                          onAddComment(qaTicket!.id, body)
                        }
                      : undefined
                  }
                  onApprove={() => {
                    onApprove(qaTicket!.id)
                  }}
                  onRequestChanges={(body) => {
                    onReject(qaTicket!.id, { markers: [], generalNote: body })
                  }}
                  actionsDisabled={false}
                />
              )}

              {batch.titleOwnerKind === 'client' && view === 'summary' && qaTicket ? (
                <ClientTitleField ticket={qaTicket} />
              ) : null}

              {canAct && view === 'summary' ? (
                <button
                  type="button"
                  onClick={() => {
                    setView('qa')
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl px-5 py-2.5 text-sm font-semibold sm:w-auto"
                >
                  Open QA — approve or request changes
                </button>
              ) : null}
            </main>
          </div>
        </div>
      )}
    </StudioModalShell>
  )
}
