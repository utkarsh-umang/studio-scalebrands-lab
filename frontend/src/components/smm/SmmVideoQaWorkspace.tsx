import { useMemo, useState } from 'react'
import { SAMPLE_VIDEO_SRC } from '@mockData/index'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DriveOrStreamVideo } from '@/components/drive/DriveOrStreamVideo'
import { QaCommentThread } from '@/components/drive/QaCommentThread'
import { VideoDeliverableReviewPanel } from '@/components/VideoDeliverableReviewPanel'
import type { DeliverableSidebarRow } from '@/lib/deliverableSidebar'
import { buildDeliverableSidebarRows } from '@/lib/deliverableSidebar'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import { deliverableIndexForTicket } from '@/lib/driveMedia'
import {
  qaPortraitChromeClass,
  qaPortraitPlayerBoxClass,
  qaPortraitVideoInnerClass,
} from '@/lib/qaVideoPortrait'
import { generalFromComments, markersFromComments, flagsToQaComments } from '@/lib/qaComments'
import type { SmmVideoCard } from '@/lib/smmBoard'
import { videoNeedsSmmQa } from '@/lib/smmBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

function rowStatusLabel(row: DeliverableSidebarRow): string {
  if (!row.ticket) return 'New on Drive — no ticket yet'
  const t = row.ticket
  if (videoNeedsSmmQa(t)) return 'Needs your QA'
  const stage = t.stageLabel.toLowerCase()
  if (t.owner === 'editor' && stage.includes('qa flagged')) return 'Editor fixing'
  if (t.owner === 'client' && stage.includes('final')) return 'With client'
  if (t.owner === 'editor') return 'With editor'
  if (t.owner === 'done' || stage.includes('scheduling')) return 'Scheduling / done'
  return t.stageLabel
}

export type SmmVideoQaWorkspaceProps = {
  batch: AdminBatchFolder
  clientName: string
  batchTickets: AdminVideoTicket[]
  initialCard: SmmVideoCard
  /** From parent (includes live reload) — drive controls live in the modal header */
  manifest: BatchDriveManifest | undefined
  onClose: () => void
  /** Same split as client final video review: sidebar on the left, main on the right */
  layoutClientStyle?: boolean
}

export function SmmVideoQaWorkspace({
  batch,
  clientName,
  batchTickets,
  initialCard,
  manifest,
  onClose,
  layoutClientStyle = false,
}: SmmVideoQaWorkspaceProps) {
  const { theme } = useTheme()
  const { submitSmmQaReview } = useAdminWorkspace()

  const manifestVideos = manifest?.videos

  const rows = useMemo(
    () => buildDeliverableSidebarRows(batch.id, manifestVideos, batchTickets),
    [batch.id, manifestVideos, batchTickets],
  )

  const initialIndex = deliverableIndexForTicket(initialCard)
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)

  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  const selectedRow =
    rows.find((r) => r.index === selectedIndex) ?? rows[0] ?? null

  const qaTicket = selectedRow?.ticket
  const canAct = qaTicket ? videoNeedsSmmQa(qaTicket) : false

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

  const asideColumn = (
    <aside
      className={[
        'border-border bg-muted/15 flex max-h-[min(32vh,260px)] shrink-0 flex-col rounded-xl border',
        layoutClientStyle
          ? 'pt-2 md:max-h-none md:w-56 md:bg-transparent md:pt-0'
          : 'md:max-h-none md:w-56',
      ].join(' ')}
    >
      {!layoutClientStyle ? (
        <p className="text-muted-foreground border-border border-b px-2 py-2 text-[10px] font-semibold uppercase tracking-wide md:px-3">
          Videos in this batch
        </p>
      ) : null}
      <ul
        className={[
          'min-h-0 flex-1 space-y-1 overflow-y-auto p-2',
          layoutClientStyle ? 'md:px-0 md:pb-0' : 'md:px-3 md:pb-3',
        ].join(' ')}
      >
        {rows.map((row) => {
          const active = row.index === selectedRow?.index
          const status = rowStatusLabel(row)
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
                    : row.ticket && videoNeedsSmmQa(row.ticket)
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
  )

  const mainColumn = (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pr-1">
      {!selectedRow ? (
        <p className="text-muted-foreground text-sm">
          {layoutClientStyle
            ? 'Select a video.'
            : 'Select a deliverable on the right.'}
        </p>
      ) : !canAct ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div
            className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950"
            role="status"
          >
            {qaTicket
              ? 'This deliverable is not waiting on SMM video QA right now. Preview only.'
              : 'No Studio ticket for this index yet — editors may still be wiring uploads. Preview only.'}
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
                  src={SAMPLE_VIDEO_SRC}
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
            videoSrc={driveFileId ? undefined : SAMPLE_VIDEO_SRC}
            fileName={fileName}
            introText=""
            theme={theme}
            commentsHeading={layoutClientStyle ? 'Your feedback' : 'QA comments'}
            initialMarkers={initialMarkers}
            initialGeneralNote={initialGeneral}
            approveLabel="Approve for client"
            rejectLabel="Send back to editor"
            disableApproveWhenHasComments
            requireCommentsOnReject
            onApprove={() => {
              submitSmmQaReview(qaTicket!.id, {
                timestampFlags: [],
                generalNote: '',
                action: 'approve',
              })
              onClose()
            }}
            onReject={(feedback) => {
              submitSmmQaReview(qaTicket!.id, {
                timestampFlags: feedback.markers.map((m) => ({
                  atSeconds: m.at,
                  note: m.text,
                })),
                generalNote: feedback.generalNote,
                action: 'send_back',
              })
              onClose()
            }}
          />
        </div>
      )}
    </main>
  )

  if (!folderUrl) {
    return (
      <div className="text-muted-foreground text-sm">
        Editor has not shared the deliverables Drive folder for {clientName} · {batch.title}{' '}
        yet.
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          No numbered videos in the manifest for this batch yet. Use{' '}
          <strong className="text-foreground">Sync from Drive</strong> in the header.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row md:gap-4">
        {layoutClientStyle ? (
          <>
            {asideColumn}
            {mainColumn}
          </>
        ) : (
          <>
            {mainColumn}
            {asideColumn}
          </>
        )}
      </div>
    </div>
  )
}
