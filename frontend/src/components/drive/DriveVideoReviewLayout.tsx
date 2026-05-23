import { DriveFolderReviewShell } from '@/components/drive/DriveFolderReviewShell'
import { QaCommentThread } from '@/components/drive/QaCommentThread'
import {
  VideoDeliverableReviewPanel,
  type VideoDeliverableReviewPanelProps,
} from '@/components/VideoDeliverableReviewPanel'
import { flagsToQaComments } from '@/lib/qaComments'
import type { AdminVideoTicket } from '@/types/pathB'

type Props = Omit<VideoDeliverableReviewPanelProps, 'driveFileId' | 'videoSrc'> & {
  batchId: string
  folderUrl: string
  folderLabel?: string
  ticket?: AdminVideoTicket
  driveFileId?: string
  videoSrc?: string
}

export function DriveVideoReviewLayout({
  batchId,
  folderUrl,
  folderLabel,
  ticket,
  driveFileId,
  videoSrc,
  ...panelProps
}: Props) {
  const history = ticket ? flagsToQaComments(ticket, 'video') : []

  return (
    <DriveFolderReviewShell
      batchId={batchId}
      folderUrl={folderUrl}
      folderLabel={folderLabel}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {history.length > 0 && (
          <div className="mb-4 shrink-0">
            <QaCommentThread comments={history} heading="Earlier feedback" />
          </div>
        )}
        <VideoDeliverableReviewPanel
          {...panelProps}
          driveFileId={driveFileId}
          videoSrc={videoSrc}
        />
      </div>
    </DriveFolderReviewShell>
  )
}
