import { useMemo, useState } from 'react'
import { SAMPLE_VIDEO_SRC } from '@mockData/index'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DeliverableVideoThumbnailTitleBlock } from '@/components/drive/DeliverableVideoThumbnailTitleBlock'
import { DeliverableSidebarList } from '@/components/drive/DeliverableSidebarList'
import type { DeliverableSidebarRow as LibSidebarRow } from '@/lib/deliverableSidebar'
import { QaCommentThread } from '@/components/drive/QaCommentThread'
import { VideoDeliverableReviewPanel } from '@/components/VideoDeliverableReviewPanel'
import { buildDeliverableSidebarRows } from '@/lib/deliverableSidebar'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import { deliverableIndexForTicket, getMediaEntry } from '@/lib/driveMedia'
import { generalFromComments, markersFromComments, flagsToQaComments } from '@/lib/qaComments'
import type { SmmVideoCard } from '@/lib/smmBoard'
import { videoNeedsSmmQa } from '@/lib/smmBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

function rowStatusLabel(row: LibSidebarRow): string {
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
  const thumbEntry = selectedRow
    ? getMediaEntry(batch.id, 'thumbnails', selectedRow.index)
    : undefined

  const sidebarRows = rows.map((row) => ({
    index: row.index,
    label: row.entry?.name ?? row.ticket?.title ?? '—',
    statusText: rowStatusLabel(row),
    highlighted: !!(row.ticket && videoNeedsSmmQa(row.ticket)),
  }))

  const asideColumn = (
    <DeliverableSidebarList
      rows={sidebarRows}
      selectedIndex={selectedRow?.index ?? null}
      onSelect={setSelectedIndex}
      heading={layoutClientStyle ? undefined : 'Videos in this batch'}
      variant={layoutClientStyle ? 'flat' : 'bordered'}
    />
  )

  const mainColumn = (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pr-1">
      {!selectedRow ? (
        <p className="text-muted-foreground text-sm">
          {layoutClientStyle
            ? 'Select a video.'
            : 'Select a deliverable on the left.'}
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
          <DeliverableVideoThumbnailTitleBlock
            theme={theme}
            videoDriveFileId={driveFileId}
            fallbackVideoSrc={driveFileId ? undefined : SAMPLE_VIDEO_SRC}
            videoFileName={fileName}
            thumbnailDriveFileId={thumbEntry?.driveFileId}
            thumbnailFileName={thumbEntry?.name}
            displayVideoTitle={qaTicket?.title}
          />
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
            showThumbnailCompanion
            pairedThumbnailDriveFileId={thumbEntry?.driveFileId}
            pairedThumbnailFileName={thumbEntry?.name}
            displayVideoTitle={qaTicket?.title}
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
        {asideColumn}
        {mainColumn}
      </div>
    </div>
  )
}
