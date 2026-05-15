import type { FinalReviewMock } from '@mockData/index'
import {
  VideoDeliverableReviewPanel,
  type VideoReviewFeedback,
} from '@/components/VideoDeliverableReviewPanel'
import type { AppTheme } from '@/theme/types'

type ClientFinalReviewPanelProps = {
  mock: FinalReviewMock
  theme: AppTheme
  onApprove?: () => void
  onReject?: () => void
}

const CLIENT_INTRO =
  "Watch the finished video below. Pause at any moment to add timestamped feedback on the right, or add general notes. Your saved comments appear under the video. Approve when you're happy, or request changes."

export function ClientFinalReviewPanel({
  mock,
  theme,
  onApprove,
  onReject,
}: ClientFinalReviewPanelProps) {
  return (
    <VideoDeliverableReviewPanel
      videoSrc={mock.videoSrc}
      introText={CLIENT_INTRO}
      theme={theme}
      onApprove={onApprove}
      onReject={
        onReject
          ? (_feedback: VideoReviewFeedback) => {
              onReject()
            }
          : undefined
      }
    />
  )
}
