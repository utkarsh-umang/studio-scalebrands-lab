import type { FinalReviewMock } from '@mockData/index'
import { DriveVideoReviewLayout } from '@/components/drive/DriveVideoReviewLayout'
import {
  deliverableIndexForTicket,
  getMediaEntry,
} from '@/lib/driveMedia'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'
import type { AppTheme } from '@/theme/types'
import type { AdminVideoTicket } from '@mockData/index'

type ClientFinalReviewPanelProps = {
  mock: FinalReviewMock
  theme: AppTheme
  ticket?: AdminVideoTicket
  deliverablesFolderUrl?: string
  onApprove?: () => void
  onReject?: (feedback: VideoReviewFeedback) => void
}

const CLIENT_INTRO =
  "Watch the finished video below. Add feedback in the panel on the right, then approve or request changes."

export function ClientFinalReviewPanel({
  mock,
  theme,
  ticket,
  deliverablesFolderUrl,
  onApprove,
  onReject,
}: ClientFinalReviewPanelProps) {
  const index = ticket ? deliverableIndexForTicket(ticket) : 1
  const entry = getMediaEntry(mock.batchId, 'videos', index)
  const folderUrl = deliverablesFolderUrl ?? ''

  if (!folderUrl) {
    return (
      <p className="text-muted-foreground text-sm">
        Deliverables folder is not linked for this batch yet.
      </p>
    )
  }

  return (
    <DriveVideoReviewLayout
      batchId={mock.batchId}
      folderUrl={folderUrl}
      folderLabel="Open deliverables folder on Drive"
      ticket={ticket}
      driveFileId={entry?.driveFileId}
      videoSrc={entry ? undefined : mock.videoSrc}
      fileName={entry?.name}
      introText={CLIENT_INTRO}
      theme={theme}
      onApprove={onApprove}
      onReject={onReject}
    />
  )
}
