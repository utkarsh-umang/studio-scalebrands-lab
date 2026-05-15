import { useState } from 'react'
import { Check, X } from 'lucide-react'
import {
  getClientClipReview,
  getClientFinalReview,
  getClientIdeaReview,
  getClientTextReview,
  SAMPLE_VIDEO_SRC,
} from '@mockData/index'
import type { ClientVideoCard } from '@/lib/clientBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'
import { ClientClipReviewPanel } from './ClientClipReviewPanel'
import { ClientFinalReviewPanel } from './ClientFinalReviewPanel'

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
  const { theme } = useTheme()
  const { applyClientVideoDecision, approveBatchClips, rejectBatchClips } =
    useAdminWorkspace()
  const [rejectReason, setRejectReason] = useState('')

  if (!card) return null

  const isReview = card.clientColumn === 'in_review' && card.reviewKind

  function finish(action: 'approve' | 'reject') {
    if (!card) return
    if (action === 'reject' && !rejectReason.trim() && card.reviewKind !== 'clip') {
      return
    }
    applyClientVideoDecision(card.id, action)
    onClose()
  }

  const clipDetail =
    card.reviewKind === 'clip'
      ? getClientClipReview(card.id, batchId)
      : undefined
  const ideaDetail = card.reviewKind === 'idea' ? getClientIdeaReview(card.id) : undefined
  const textDetail = card.reviewKind === 'text' ? getClientTextReview(card.id) : undefined
  const finalDetail =
    card.reviewKind === 'final' ? getClientFinalReview(card.id) : undefined
  const isFinalReview = card.reviewKind === 'final'

  if (clipDetail) {
    return (
      <ModalShell
        title="Clip approval"
        subtitle={batchTitle}
        onClose={onClose}
        wide
      >
        <ClientClipReviewPanel
          detail={clipDetail}
          onApprove={() => {
            approveBatchClips(batchId, card.id)
            onClose()
          }}
          onReject={(note) => {
            rejectBatchClips(batchId, card.id, note)
            onClose()
          }}
        />
      </ModalShell>
    )
  }

  if (ideaDetail) {
    return (
      <ModalShell title={card.title} subtitle={batchTitle} onClose={onClose}>
        <p className="text-muted-foreground mb-4 text-sm">Review video ideas for this batch.</p>
        <ul className="space-y-2">
          {ideaDetail.ideas.map((idea) => (
            <li
              key={idea.id}
              className="border-border text-foreground rounded-lg border px-3 py-2 text-sm"
            >
              {idea.title}
            </li>
          ))}
        </ul>
        <ReviewActions
          rejectReason={rejectReason}
          onRejectReason={setRejectReason}
          onApprove={() => {
            finish('approve')
          }}
          onReject={() => {
            finish('reject')
          }}
        />
      </ModalShell>
    )
  }

  if (textDetail) {
    return (
      <ModalShell title={card.title} subtitle={batchTitle} onClose={onClose}>
        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
              Thumbnail title
            </p>
            <p className="text-foreground mt-1 text-sm font-medium">
              {textDetail.thumbnailText}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
              Video title
            </p>
            <p className="text-foreground mt-1 text-sm font-medium">{textDetail.videoTitle}</p>
          </div>
        </div>
        <ReviewActions
          rejectReason={rejectReason}
          onRejectReason={setRejectReason}
          onApprove={() => {
            finish('approve')
          }}
          onReject={() => {
            finish('reject')
          }}
        />
      </ModalShell>
    )
  }

  if (isFinalReview) {
    return (
      <ModalShell
        title="Final video review"
        subtitle={card.title}
        onClose={onClose}
        wide
      >
        <ClientFinalReviewPanel
          mock={{
            batchId: card.batchId,
            batchTitle,
            videoSrc: finalDetail?.videoSrc ?? SAMPLE_VIDEO_SRC,
            thumbnailAlt: finalDetail?.thumbnailAlt ?? card.title,
          }}
          theme={theme}
          onApprove={() => {
            finish('approve')
          }}
          onReject={() => {
            finish('reject')
          }}
        />
      </ModalShell>
    )
  }

  return (
    <ModalShell title={card.title} subtitle={batchTitle} onClose={onClose}>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {isReview
          ? 'This item is waiting for your review, but detail data is not wired in the prototype yet.'
          : 'Scale Brands is working on this video. You will be notified when it needs your approval.'}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">Status: {card.stageLabel}</p>
      {isReview && (
        <ReviewActions
          rejectReason={rejectReason}
          onRejectReason={setRejectReason}
          onApprove={() => {
            finish('approve')
          }}
          onReject={() => {
            finish('reject')
          }}
        />
      )}
    </ModalShell>
  )
}

function ModalShell({
  title,
  subtitle,
  onClose,
  wide,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  wide?: boolean
  children: React.ReactNode
}) {
  void wide
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby="client-card-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={[
          'border-border bg-background relative flex h-[min(92vh,960px)] w-[min(96vw,1280px)] flex-col overflow-hidden rounded-2xl border shadow-2xl',
        ].join(' ')}
        style={{ boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.55) inset' }}
      >
        <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2 id="client-card-modal-title" className="text-foreground font-semibold">
              {title}
            </h2>
            <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  )
}

function ReviewActions({
  rejectReason,
  onRejectReason,
  onApprove,
  onReject,
}: {
  rejectReason: string
  onRejectReason: (v: string) => void
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="border-border mt-6 space-y-3 border-t pt-4">
      <label className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wide">
        Reason if rejecting
      </label>
      <textarea
        value={rejectReason}
        onChange={(e) => {
          onRejectReason(e.target.value)
        }}
        rows={3}
        placeholder="Tell us what to change…"
        className="border-border bg-background w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--success)] px-4 py-2.5 text-sm font-semibold text-white sm:flex-none"
        >
          <Check className="size-4" aria-hidden />
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={!rejectReason.trim()}
          className="border-border inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 sm:flex-none"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
