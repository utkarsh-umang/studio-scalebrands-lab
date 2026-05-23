import { StudioModalShell } from '@/components/StudioModalShell'
import { NumberedClipsModal } from '@/components/path-b'
import type { ClientVideoCard } from '@/lib/clientBoard'
import { clientBatchKanbanPhase } from '@/lib/clientBoard'
import { getManifestForBatch } from '@/lib/driveMedia'
import {
  useApproveBatchClipsMutation,
  useRejectBatchClipsMutation,
} from '@/hooks/api/pathB/useClipsFolderMutations'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { ClientClipIdentificationStatusModal } from './ClientClipIdentificationStatusModal'
import { ClientUnifiedQaModal } from './ClientUnifiedQaModal'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'

const CLIP_IDENTIFICATION_PREVIEW_BANNER =
  'Preview only — our team is still finalizing clip identification. You will approve the full clip list when it is ready for your review.'

const CLIPS_IN_PRODUCTION_BANNER =
  'Our team is working on these clips now. You will review finished videos, thumbnails, and titles here when they are ready.'

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
    getVideosForBatch,
    appendClientQaComment,
  } = useAdminWorkspace()
  const approveBatchClips = useApproveBatchClipsMutation(batchId)
  const rejectBatchClips = useRejectBatchClipsMutation(batchId)

  const batch = batches.find((b) => b.id === batchId)
  const batchTickets = batch ? getVideosForBatch(batch.id) : []

  if (!card || !batch) return null

  if (card.clientGateKind === 'clip_identification') {
    if (batch.clipsFolderUrl?.trim()) {
      return (
        <NumberedClipsModal
          open
          batchId={batchId}
          batchTitle={batchTitle}
          clipsFolderUrl={batch.clipsFolderUrl}
          mode="view"
          resetKey={card.id}
          onClose={onClose}
          statusBanner={CLIP_IDENTIFICATION_PREVIEW_BANNER}
        />
      )
    }
    return (
      <ClientClipIdentificationStatusModal
        batch={batch}
        batchTitle={batchTitle}
        onClose={onClose}
      />
    )
  }

  if (card.clientGateKind === 'clips_in_production' && batch.clipsFolderUrl?.trim()) {
    return (
      <NumberedClipsModal
        open
        batchId={batchId}
        batchTitle={batchTitle}
        clipsFolderUrl={batch.clipsFolderUrl}
        mode="view"
        resetKey={card.id}
        onClose={onClose}
        statusBanner={CLIPS_IN_PRODUCTION_BANNER}
      />
    )
  }

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
          const manifest = getManifestForBatch(batchId)
          const clipCount = manifest?.clips.length
          approveBatchClips.mutate(
            {
              videoTicketId: card.id,
              ...(clipCount != null && clipCount > 0 ? { clipCount } : {}),
            },
            { onSuccess: onClose },
          )
        }}
        onRejectClips={(note) => {
          rejectBatchClips.mutate(
            { videoTicketId: card.id, note },
            { onSuccess: onClose },
          )
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
