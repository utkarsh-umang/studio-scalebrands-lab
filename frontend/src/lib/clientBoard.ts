import type {
  AdminBatchFolder,
  AdminVideoTicket,
  VideoPipelineOwner,
} from '@/types/pathB'

/** Client-facing Kanban columns (4-bucket model). */
export type ClientBoardColumn =
  | 'yet_to_start'
  | 'in_progress'
  | 'in_review'
  | 'completed'

/** Path B v1 — client-facing review surfaces only. */
export type ClientReviewKind = 'clip' | 'final'

/** Pre-split status cards (no client approve/reject on these). */
export type ClientGateKind = 'clip_identification' | 'clips_in_production'

export const CLIENT_BOARD_COLUMNS: {
  id: ClientBoardColumn
  label: string
  hint: string
}[] = [
  {
    id: 'yet_to_start',
    label: 'Yet to start',
    hint: 'Share source or clips folder',
  },
  {
    id: 'in_progress',
    label: 'In progress',
    hint: 'Scale Brands is working',
  },
  {
    id: 'in_review',
    label: 'In review',
    hint: 'Needs your approval',
  },
  {
    id: 'completed',
    label: 'Completed',
    hint: 'Scheduled or delivered',
  },
]

export type ClientVideoCard = AdminVideoTicket & {
  clientColumn: ClientBoardColumn
  reviewKind: ClientReviewKind | null
  clientGateKind: ClientGateKind | null
}

function reviewKindFromStage(stageLabel: string): ClientReviewKind | null {
  const s = stageLabel.toLowerCase()
  if (s.includes('clip review')) return 'clip'
  if (s.includes('client qa')) return 'final'
  if (s.includes('final')) return 'final'
  return null
}

export type ClientBatchKanbanPhase = 'intake' | 'pre_split' | 'post_split'

export function clientBatchKanbanPhase(batch: AdminBatchFolder): ClientBatchKanbanPhase {
  if (batchNeedsClientIntake(batch)) return 'intake'
  if (!batch.editorDeliverablesDriveUrl?.trim()) return 'pre_split'
  return 'post_split'
}

function isPreSplitGateTicket(video: AdminVideoTicket): boolean {
  return video.deliverableIndex == null || video.deliverableIndex < 1
}

/** Credits reserved on active batches until debited at batch complete. */
export function clientReservedCredits(batches: AdminBatchFolder[]): number {
  return batches
    .filter((b) => b.status === 'active' && !b.creditsDebited)
    .reduce((sum, b) => sum + b.creditCost, 0)
}

/** Map operational owner + stage to the client 4-column board. */
export function deriveClientColumn(
  owner: VideoPipelineOwner,
  stageLabel: string,
): ClientBoardColumn {
  if (owner === 'done') return 'completed'
  const review = reviewKindFromStage(stageLabel)
  if (owner === 'client' && review) return 'in_review'
  if (
    owner === 'client' ||
    stageLabel.toLowerCase().includes('review')
  ) {
    return review ? 'in_review' : 'in_progress'
  }
  return 'in_progress'
}

export function clientGateKindFromVideo(
  video: AdminVideoTicket,
  batch: AdminBatchFolder,
): ClientGateKind | null {
  if (reviewKindFromStage(video.stageLabel)) return null
  if (!isPreSplitGateTicket(video)) return null

  const stage = video.stageLabel.toLowerCase()
  if (
    stage.includes('clip identification') ||
    stage.includes('identifying') ||
    batch.clipReviewPhase === 'smm_identifying'
  ) {
    return 'clip_identification'
  }

  if (
    batch.intakePath === 'clips_ready' &&
    batch.clipReviewPhase === 'approved' &&
    (stage.includes('deliverables') ||
      stage.includes('production') ||
      stage.includes('awaiting'))
  ) {
    return 'clips_in_production'
  }

  return null
}

export function clientCardStatusHint(card: ClientVideoCard): string {
  if (card.clientColumn === 'in_review' && card.reviewKind) {
    return 'Action needed'
  }
  if (card.deliverableIndex != null && card.deliverableIndex > 0) {
    if (card.owner === 'editor') return 'With editor — in production'
    if (card.owner === 'smm') return 'With social team — internal review'
    if (card.owner === 'scheduling') return 'Ready to schedule'
  }
  switch (card.clientGateKind) {
    case 'clip_identification':
      return 'Identifying clips from your footage'
    case 'clips_in_production':
      return 'Editing your submitted clips'
    default:
      return 'With Scale Brands'
  }
}

export function toClientVideoCard(
  ticket: AdminVideoTicket,
  batch: AdminBatchFolder,
): ClientVideoCard {
  return {
    ...ticket,
    clientColumn: deriveClientColumn(ticket.owner, ticket.stageLabel),
    reviewKind: reviewKindFromStage(ticket.stageLabel),
    clientGateKind: clientGateKindFromVideo(ticket, batch),
  }
}

export function videoNeedsClientFinalReview(video: AdminVideoTicket): boolean {
  if (video.owner !== 'client') return false
  if (video.releasedToClientFinalVideoReview === false) return false
  return reviewKindFromStage(video.stageLabel) === 'final'
}

export function batchNeedsClientIntake(batch: AdminBatchFolder): boolean {
  if (batch.status !== 'active') return false
  // Path A: once ideas are requested, intake is done (idea flow takes over).
  if (batch.intakePath === 'idea_first') return false
  if (!batch.intakePath) return true
  // clipReviewPhase is set the moment intake is submitted, so any value means the
  // client already completed intake even if sourceMediaUrl is absent in mock data.
  if (batch.clipReviewPhase) return false
  if (batch.intakePath === 'source_media') {
    return !batch.sourceMediaUrl?.trim()
  }
  if (batch.intakePath === 'clips_ready') {
    return !batch.clipsFolderUrl?.trim()
  }
  return true
}

/** Hide ghost “final review” rows until `releasedToClientFinalVideoReview` allows them. */
function clientSeesFinalVideoReviewCard(video: AdminVideoTicket): boolean {
  if (reviewKindFromStage(video.stageLabel) !== 'final') return true
  return videoNeedsClientFinalReview(video)
}

/**
 * Path B kanban card rules (path-b-ui-spec.md §4.3):
 * intake → 0 cards; pre-split → one gate card; post-split → n indexed deliverables.
 */
export function filterVideosForClientKanban(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): AdminVideoTicket[] {
  const phase = clientBatchKanbanPhase(batch)
  if (phase === 'intake') return []

  let out: AdminVideoTicket[]
  if (phase === 'pre_split') {
    const approvedProduction = videos.filter(
      (video) =>
        video.deliverableIndex != null &&
        video.deliverableIndex > 0 &&
        batch.clipReviewPhase === 'approved',
    )
    if (approvedProduction.length > 0) {
      return approvedProduction.filter(clientSeesFinalVideoReviewCard)
    }

    out = videos.filter(isPreSplitGateTicket)
    if (
      batch.intakePath === 'clips_ready' &&
      batch.clipReviewPhase === 'approved'
    ) {
      out = out.filter((v) => !v.stageLabel.toLowerCase().includes('clip review'))
    } else if (
      batch.intakePath === 'source_media' &&
      batch.clipReviewPhase &&
      batch.clipReviewPhase !== 'approved'
    ) {
      out = out.filter((v) => {
        const stage = v.stageLabel.toLowerCase()
        if (stage.includes('clip review')) return true
        if (stage.includes('clip identification') || stage.includes('identifying')) {
          return true
        }
        return v.owner === 'client'
      })
    }
  } else {
    out = videos.filter(
      (v) => v.deliverableIndex != null && v.deliverableIndex > 0,
    )
  }

  return out.filter(clientSeesFinalVideoReviewCard)
}

export type ClientAttentionItem = {
  videoId: string
  batchId: string
  title: string
  reviewKind: ClientReviewKind
  batchTitle: string
}

export function listClientAttention(
  batches: AdminBatchFolder[],
  videos: AdminVideoTicket[],
): ClientAttentionItem[] {
  const batchById = new Map(batches.map((b) => [b.id, b]))
  return videos
    .filter((v) => deriveClientColumn(v.owner, v.stageLabel) === 'in_review')
    .map((v) => {
      const batch = batchById.get(v.batchId)
      const kind = reviewKindFromStage(v.stageLabel)
      if (!kind) return null
      if (kind === 'final' && !videoNeedsClientFinalReview(v)) return null
      return {
        videoId: v.id,
        batchId: v.batchId,
        title: v.title,
        reviewKind: kind,
        batchTitle: batch?.title ?? 'Batch',
      }
    })
    .filter((x): x is ClientAttentionItem => x !== null)
}

/** Prototype transitions when the client approves or rejects on a review card. */
export function nextStateAfterClientAction(
  video: AdminVideoTicket,
  action: 'approve' | 'reject',
): Pick<
  AdminVideoTicket,
  'owner' | 'stageLabel' | 'deadlineRole' | 'demoStage' | 'releasedToClientFinalVideoReview'
> {
  const kind = reviewKindFromStage(video.stageLabel)

  if (action === 'approve') {
    switch (kind) {
      case 'clip':
        return {
          owner: 'editor',
          stageLabel: 'Awaiting deliverables folder',
          deadlineRole: 'editor',
          demoStage: 'pre_split_production',
          releasedToClientFinalVideoReview: false,
        }
      case 'final':
        return {
          owner: 'scheduling',
          stageLabel: 'Scheduling',
          deadlineRole: null,
          demoStage: 'scheduling',
          releasedToClientFinalVideoReview: false,
        }
      default:
        return {
          owner: 'smm',
          stageLabel: 'In progress',
          deadlineRole: 'smm',
          demoStage: 'revision_via_smm',
          releasedToClientFinalVideoReview: false,
        }
    }
  }

  switch (kind) {
    case 'clip':
      return {
        owner: 'smm',
        stageLabel: 'Clip identification',
        deadlineRole: 'smm',
        demoStage: 'clips_identifying',
        releasedToClientFinalVideoReview: false,
      }
    case 'final':
      return {
        owner: 'smm',
        stageLabel: 'Client revisions',
        deadlineRole: 'smm',
        demoStage: 'revision_via_smm',
        releasedToClientFinalVideoReview: false,
      }
    default:
      return {
        owner: 'smm',
        stageLabel: 'In progress',
        deadlineRole: 'smm',
        demoStage: 'revision_via_smm',
        releasedToClientFinalVideoReview: false,
      }
  }
}

export function resolveClientProfileId(
  email: string,
  profiles: { id: string; loginId: string }[],
): string | null {
  const normalized = email.trim().toLowerCase()
  const match = profiles.find((p) => p.loginId.toLowerCase() === normalized)
  return match?.id ?? null
}
