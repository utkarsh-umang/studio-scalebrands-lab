import { SAMPLE_VIDEO_SRC } from '@mockData/index'
import { DriveVideoReviewLayout } from '@/components/drive/DriveVideoReviewLayout'
import { StudioModalShell } from '@/components/StudioModalShell'
import {
  deliverableIndexForTicket,
  getMediaEntry,
} from '@/lib/driveMedia'
import { generalFromComments, markersFromComments } from '@/lib/qaComments'
import type { SmmVideoCard } from '@/lib/smmBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

const SMM_QA_INTRO =
  "Review the editor's deliverable below. Add timestamped feedback when using a direct video URL, or use general notes with the Drive preview. Approve to send to the client, or send back to the editor with your flags."

type Props = {
  card: SmmVideoCard
  batchId: string
  batchTitle: string
  clientName: string
  deliverablesFolderUrl?: string
  open: boolean
  onClose: () => void
}

export function SmmVideoQaModal({
  card,
  batchId,
  batchTitle,
  clientName,
  deliverablesFolderUrl,
  open,
  onClose,
}: Props) {
  const { theme } = useTheme()
  const { submitSmmQaReview } = useAdminWorkspace()

  if (!open) return null

  const index = deliverableIndexForTicket(card)
  const entry = getMediaEntry(batchId, 'videos', index)
  const history = card.qaCommentHistory ?? []
  const initialMarkers =
    history.length > 0
      ? markersFromComments(history)
      : (card.qaFlags?.map((f) => ({ at: f.atSeconds, text: f.note })) ?? [])
  const initialGeneral =
    history.length > 0
      ? generalFromComments(history)
      : (card.qaGeneralNote ?? '')

  const folderUrl = deliverablesFolderUrl ?? ''

  return (
    <StudioModalShell
      title="Video QA"
      subtitle={`${clientName} · ${batchTitle} · ${card.title}`}
      titleId="smm-qa-title"
      onClose={onClose}
    >
      {folderUrl ? (
        <DriveVideoReviewLayout
          batchId={batchId}
          folderUrl={folderUrl}
          folderLabel="Open deliverables folder on Drive"
          ticket={card}
          driveFileId={entry?.driveFileId}
          videoSrc={entry ? undefined : SAMPLE_VIDEO_SRC}
          fileName={entry?.name}
          introText={SMM_QA_INTRO}
          theme={theme}
          commentsHeading="QA comments"
          initialMarkers={initialMarkers}
          initialGeneralNote={initialGeneral}
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
      ) : (
        <p className="text-muted-foreground text-sm">
          Editor has not shared the deliverables Drive folder yet.
        </p>
      )}
    </StudioModalShell>
  )
}
