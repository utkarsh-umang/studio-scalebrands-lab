import { SAMPLE_VIDEO_SRC } from '@mockData/index'
import { StudioModalShell } from '@/components/StudioModalShell'
import { VideoDeliverableReviewPanel } from '@/components/VideoDeliverableReviewPanel'
import type { SmmVideoCard } from '@/lib/smmBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

const SMM_QA_INTRO =
  "Review the editor's deliverable below. Pause at any moment to add timestamped feedback on the right, or add general notes. Saved comments appear under the video. Approve to send to the client, or send back to the editor with your flags."

type Props = {
  card: SmmVideoCard
  batchTitle: string
  clientName: string
  open: boolean
  onClose: () => void
}

export function SmmVideoQaModal({
  card,
  batchTitle,
  clientName,
  open,
  onClose,
}: Props) {
  const { theme } = useTheme()
  const { submitSmmQaReview } = useAdminWorkspace()

  if (!open) return null

  const initialMarkers =
    card.qaFlags?.map((f) => ({ at: f.atSeconds, text: f.note })) ?? []

  return (
    <StudioModalShell
      title="Video QA"
      subtitle={`${clientName} · ${batchTitle} · ${card.title}`}
      titleId="smm-qa-title"
      onClose={onClose}
    >
      <VideoDeliverableReviewPanel
        videoSrc={SAMPLE_VIDEO_SRC}
        introText={SMM_QA_INTRO}
        theme={theme}
        commentsHeading="QA comments"
        initialMarkers={initialMarkers}
        initialGeneralNote={card.qaGeneralNote ?? ''}
        approveLabel="Approve for client"
        rejectLabel="Send back to editor"
        disableApproveWhenHasComments
        requireCommentsOnReject
        onApprove={() => {
          submitSmmQaReview(card.id, {
            timestampFlags: [],
            generalNote: '',
            action: 'approve',
          })
          onClose()
        }}
        onReject={(feedback) => {
          submitSmmQaReview(card.id, {
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
    </StudioModalShell>
  )
}
