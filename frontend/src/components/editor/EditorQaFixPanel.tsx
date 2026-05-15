import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DeliverableVideoThumbnailTitleBlock } from '@/components/drive/DeliverableVideoThumbnailTitleBlock'
import { QaCommentThread } from '@/components/drive/QaCommentThread'
import {
  deliverableIndexForTicket,
  getMediaEntry,
} from '@/lib/driveMedia'
import { activeCommentsForSlot, flagsToQaComments } from '@/lib/qaComments'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  ticket: AdminVideoTicket
  /** When manifest has no video file yet (prototype fallback) */
  fallbackVideoSrc?: string
  onResubmitted?: () => void
}

export function EditorQaFixPanel({
  batch,
  clientName,
  ticket,
  fallbackVideoSrc,
  onResubmitted,
}: Props) {
  const { theme } = useTheme()
  const { resubmitEditorVideoQa } = useAdminWorkspace()

  const index = deliverableIndexForTicket(ticket)
  const videoEntry = getMediaEntry(batch.id, 'videos', index)
  const thumbEntry = getMediaEntry(batch.id, 'thumbnails', index)
  const fromSlot = activeCommentsForSlot(ticket.qaCommentHistory, 'video')
  const history =
    fromSlot.length > 0
      ? fromSlot
      : flagsToQaComments(ticket, 'video').filter((c) => c.slot === 'video')
  const backToClient = ticket.lastRevisionRequestedBy === 'client'

  return (
    <div className="border-border bg-background/80 space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-foreground text-sm font-semibold">
            Video {index} — address QA feedback
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{ticket.title}</p>
          <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
            Re-upload the file in your Drive <span className="text-foreground font-medium">Video</span>{' '}
            folder, then resubmit. Comments below are marked resolved for this version when you
            resubmit.
            {backToClient
              ? ' Returns to client final QA (SMM already approved).'
              : ' Returns to SMM video QA.'}
          </p>
        </div>
        <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
          {clientName}
        </p>
      </div>

      {batch.editorDeliverablesDriveUrl ? (
        <a
          href={batch.editorDeliverablesDriveUrl}
          target="_blank"
          rel="noreferrer"
          className="border-border bg-muted/30 text-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
        >
          Open deliverables folder
          <ExternalLink className="ml-auto size-3.5 shrink-0" aria-hidden />
        </a>
      ) : null}

      <DeliverableVideoThumbnailTitleBlock
        theme={theme}
        videoDriveFileId={videoEntry?.driveFileId}
        fallbackVideoSrc={videoEntry?.driveFileId ? undefined : fallbackVideoSrc}
        videoFileName={videoEntry?.name}
        thumbnailDriveFileId={thumbEntry?.driveFileId}
        thumbnailFileName={thumbEntry?.name}
        displayVideoTitle={ticket.title}
      />

      <QaCommentThread comments={history} heading="QA thread (video)" />

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            resubmitEditorVideoQa(ticket.id)
            onResubmitted?.()
          }}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          {backToClient ? 'Resubmit to client QA' : 'Resubmit to SMM QA'}
        </button>
      </div>
    </div>
  )
}
