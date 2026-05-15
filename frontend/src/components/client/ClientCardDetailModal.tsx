import { useEffect, useState, type ReactNode } from 'react'
import { Check, ExternalLink, RefreshCw } from 'lucide-react'
import {
  getClientFinalReview,
  getClientIdeaReview,
  getClientTextReview,
  SAMPLE_VIDEO_SRC,
} from '@mockData/index'
import type { ClientVideoCard } from '@/lib/clientBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'
import { StudioModalShell } from '@/components/StudioModalShell'
import { formatSyncedAt, getManifestForBatch, reloadDriveManifestForBatch } from '@/lib/driveMedia'
import { ClientClipReviewPanel } from './ClientClipReviewPanel'
import { ClientFinalVideoReviewModal } from './ClientFinalVideoReviewModal'
import { ClientThumbnailReviewModal } from './ClientThumbnailReviewModal'

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
  const { batches, applyClientVideoDecision, approveBatchClips, rejectBatchClips, getVideosForBatch } =
    useAdminWorkspace()
  const batch = batches.find((b) => b.id === batchId)
  const [rejectReason, setRejectReason] = useState('')

  const [clipManifestSnap, setClipManifestSnap] = useState<
    ReturnType<typeof getManifestForBatch> | undefined
  >(undefined)
  const [clipSyncing, setClipSyncing] = useState(false)

  useEffect(() => {
    setClipManifestSnap(undefined)
  }, [batchId])

  if (!card) return null

  const clipManifest = clipManifestSnap ?? getManifestForBatch(batchId)

  async function handleClipSyncFromDrive() {
    if (!batchId) return
    setClipSyncing(true)
    try {
      const next = await reloadDriveManifestForBatch(batchId)
      if (next) setClipManifestSnap(next)
    } finally {
      setClipSyncing(false)
    }
  }

  const isReview = card.clientColumn === 'in_review' && card.reviewKind

  function finish(
    action: 'approve' | 'reject',
    opts?: { rejectNote?: string; feedback?: import('@/components/VideoDeliverableReviewPanel').VideoReviewFeedback },
  ) {
    if (!card) return
    if (action === 'reject' && !opts?.feedback && !opts?.rejectNote?.trim() && card.reviewKind !== 'clip') {
      if (!rejectReason.trim()) return
    }
    applyClientVideoDecision(card.id, action, {
      rejectNote: opts?.rejectNote ?? rejectReason,
      feedback: opts?.feedback,
    })
    onClose()
  }
  const ideaDetail = card.reviewKind === 'idea' ? getClientIdeaReview(card.id) : undefined
  const textDetail = card.reviewKind === 'text' ? getClientTextReview(card.id) : undefined
  const finalDetail =
    card.reviewKind === 'final' ? getClientFinalReview(card.id) : undefined
  const isFinalReview = card.reviewKind === 'final'

  if (card.reviewKind === 'clip' && batch?.clipsFolderUrl) {
    const clipHeaderMeta = clipManifest ? (
      <>
        Last synced {formatSyncedAt(clipManifest.syncedAt)}
        {clipManifest.unmapped.length > 0 && (
          <span className="text-destructive">
            {' '}
            · {clipManifest.unmapped.length} unmapped file(s)
          </span>
        )}
      </>
    ) : (
      'No Drive manifest loaded.'
    )

    return (
      <ModalShell
        title="Clip approval"
        subtitle={batchTitle}
        onClose={onClose}
        headerMeta={clipHeaderMeta}
        headerAside={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                void handleClipSyncFromDrive()
              }}
              disabled={clipSyncing}
              className="border-border bg-muted/30 hover:border-primary/35 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${clipSyncing ? 'animate-spin' : ''}`} aria-hidden />
              Sync with Drive
            </button>
            <a
              href={batch.clipsFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
            >
              Clips folder
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
          </div>
        }
      >
        <ClientClipReviewPanel
          batchId={batchId}
          manifest={clipManifest}
          clipsFolderUrl={batch.clipsFolderUrl}
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

  if (card.reviewKind === 'thumbnail' && batch) {
    if (!batch.editorDeliverablesDriveUrl) {
      return (
        <ModalShell title={card.title} subtitle={batchTitle} onClose={onClose}>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The editor has not linked the batch deliverables folder on Drive yet. When they do, you can
            review thumbnails here.
          </p>
        </ModalShell>
      )
    }
    return (
      <ClientThumbnailReviewModal
        key={card.id}
        batch={batch}
        batchTitle={batchTitle}
        batchTickets={getVideosForBatch(batch.id)}
        initialTicket={card}
        fallbackVideoSrc={SAMPLE_VIDEO_SRC}
        theme={theme}
        onClose={onClose}
        onApprove={(videoId) => {
          applyClientVideoDecision(videoId, 'approve')
          onClose()
        }}
        onReject={(videoId, feedback) => {
          applyClientVideoDecision(videoId, 'reject', { feedback })
          onClose()
        }}
      />
    )
  }

  if (isFinalReview && batch) {
    return (
      <ClientFinalVideoReviewModal
        key={card.id}
        batch={batch}
        batchTitle={batchTitle}
        batchTickets={getVideosForBatch(batch.id)}
        initialTicket={card}
        fallbackVideoSrc={finalDetail?.videoSrc ?? SAMPLE_VIDEO_SRC}
        theme={theme}
        onClose={onClose}
        onApprove={(videoId) => {
          applyClientVideoDecision(videoId, 'approve')
          onClose()
        }}
        onReject={(videoId, feedback) => {
          applyClientVideoDecision(videoId, 'reject', { feedback })
          onClose()
        }}
      />
    )
  }

  if (isFinalReview && !batch) {
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
  headerAside,
  headerMeta,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  headerAside?: ReactNode
  headerMeta?: ReactNode
  children: React.ReactNode
}) {
  return (
    <StudioModalShell
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      titleId="client-card-modal-title"
      headerAside={headerAside}
      headerMeta={headerMeta}
    >
      {children}
    </StudioModalShell>
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
