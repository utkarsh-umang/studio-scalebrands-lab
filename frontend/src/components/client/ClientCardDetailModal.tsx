import { StudioModalShell } from '@/components/StudioModalShell'
import { NumberedClipsModal } from '@/components/path-b'
import type { ClientVideoCard } from '@/lib/clientBoard'
import { clientBatchKanbanPhase } from '@/lib/clientBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { ClientUnifiedQaModal } from './ClientUnifiedQaModal'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'

type Props = {
  card: ClientVideoCard | null
  batchId: string
  batchTitle: string
  onClose: () => void
}

export function ClientCardDetailModal({
  card,
  batchId,
  batchTitle,
  onClose,
}: Props) {
  const {
    batches,
    applyClientVideoDecision,
    approveBatchClips,
    rejectBatchClips,
    getVideosForBatch,
    appendClientQaComment,
  } = useAdminWorkspace()

  const batch = batches.find((b) => b.id === batchId)
  const batchTickets = batch ? getVideosForBatch(batch.id) : []

  if (!card || !batch) return null

  if (card.reviewKind === 'clip' && batch.clipsFolderUrl?.trim()) {
    return (
      <NumberedClipsModal
        open
        batchId={batchId}
        batchTitle={batchTitle}
        clipsFolderUrl={batch.clipsFolderUrl}
        mode="client"
        resetKey={card.id}
        onClose={onClose}
        onApproveAll={() => {
          approveBatchClips(batchId, card.id)
          onClose()
        }}
        onRejectClips={(note) => {
          rejectBatchClips(batchId, card.id, note)
          onClose()
        }}
      />
    )
  }

  if (
    batch.editorDeliverablesDriveUrl?.trim() &&
    card.deliverableIndex != null &&
    card.deliverableIndex > 0
  ) {
    return (
      <ClientUnifiedQaModal
        open
        batch={batch}
        batchTitle={batchTitle}
        batchTickets={batchTickets}
        initialTicket={card}
        onClose={onClose}
        onApprove={(videoId) => {
          applyClientVideoDecision(videoId, 'approve')
          onClose()
        }}
        onReject={(videoId, feedback: VideoReviewFeedback) => {
          applyClientVideoDecision(videoId, 'reject', { feedback })
          onClose()
        }}
        onAddComment={(videoId, body) => {
          appendClientQaComment(videoId, body)
        }}
      />
    )
  }

  const phase = clientBatchKanbanPhase(batch)
  const subtitle =
    phase === 'pre_split'
      ? `${batchTitle} · Batch gate`
      : `${batchTitle} · #${card.deliverableIndex ?? '—'}`

  return (
    <StudioModalShell
      title={card.title}
      subtitle={subtitle}
      titleId="client-card-status-title"
      onClose={onClose}
    >
      <p className="text-muted-foreground text-sm leading-relaxed">
        {card.clientColumn === 'in_review'
          ? 'This item is not ready for your review yet. Check back when our team releases it to you.'
          : 'Scale Brands is working on this step. You will see it in Needs your attention when action is required.'}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        Status: {card.stageLabel}
        {card.deliverableIndex != null && card.deliverableIndex > 0
          ? ` · Deliverable #${card.deliverableIndex}`
          : null}
      </p>
    </StudioModalShell>
  )
}
