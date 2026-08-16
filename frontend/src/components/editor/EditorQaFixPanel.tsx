import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { QaCommentWorkspace } from '@/components/path-b/QaCommentWorkspace'
import { useResubmitToSmmQaMutation } from '@/hooks/api/pathB/useSmmQaMutations'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import {
  deliverableIndexForTicket,
  getMediaEntry,
} from '@/lib/driveMedia'
import { activeCommentsForSlot, flagsToQaComments } from '@/lib/qaComments'
import { studioMediaSlot } from '@/lib/studioMedia'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  ticket: AdminVideoTicket
  manifest?: BatchDriveManifest
  fallbackVideoSrc?: string
  onResubmitted?: () => void
}

export function EditorQaFixPanel({
  batch,
  clientName,
  ticket,
  manifest,
  fallbackVideoSrc,
  onResubmitted,
}: Props) {
  const resubmitToSmmQa = useResubmitToSmmQaMutation(ticket.id)

  const index = deliverableIndexForTicket(ticket)
  const videoEntry =
    manifest?.videos.find((v) => v.index === index) ??
    getMediaEntry(batch.id, 'videos', index)
  const thumbEntry =
    manifest?.thumbnails.find((t) => t.index === index) ??
    getMediaEntry(batch.id, 'thumbnails', index)
  const studioVideo = studioMediaSlot(ticket, 'video')
  const studioThumbnail = studioMediaSlot(ticket, 'thumbnail')
  const fromSlot = activeCommentsForSlot(ticket.qaCommentHistory, 'video')
  const history =
    fromSlot.length > 0
      ? fromSlot
      : flagsToQaComments(ticket, 'video').filter((c) => c.slot === 'video')
  const backToClient = ticket.lastRevisionRequestedBy === 'client'

  return (
    <div className="space-y-4 pb-1">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-foreground text-sm font-semibold">
            Video {index} — address QA feedback
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{ticket.title}</p>
          <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
            Upload a new video version in the production workspace, then resubmit. Old comments
            stay visible after you upload the replacement.
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
          rel="noopener noreferrer"
          className="border-border bg-muted/30 text-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
        >
          Open deliverables folder
          <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
        </a>
      ) : null}

      <QaCommentWorkspace
        role="editor"
        videoTitle={ticket.title}
        deliverableIndex={index}
        comments={history}
        videoDriveFileId={videoEntry?.driveFileId}
        videoAssetId={studioVideo?.assetId}
        videoFileName={studioVideo?.name ?? videoEntry?.name}
        fallbackVideoSrc={studioVideo || videoEntry?.driveFileId ? undefined : fallbackVideoSrc}
        thumbnailDriveFileId={thumbEntry?.driveFileId}
        thumbnailAssetId={studioThumbnail?.assetId}
        thumbnailFileName={studioThumbnail?.name ?? thumbEntry?.name}
        displayVideoTitle={ticket.editorPublishTitle?.trim() || ticket.title}
        secondaryPackageHelper="Thumbnail and title are for reference. Address video feedback in the comment thread, then upload a new Studio version."
        customFooter={
          <footer className="border-border border-t pt-4">
            <button
              type="button"
              disabled={resubmitToSmmQa.isPending}
              onClick={() => {
                resubmitToSmmQa.mutate(
                  {},
                  {
                    onSuccess: () => {
                      onResubmitted?.()
                    },
                  },
                )
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {backToClient ? 'Resubmit to client QA' : 'Resubmit to SMM QA'}
            </button>
          </footer>
        }
      />
    </div>
  )
}
