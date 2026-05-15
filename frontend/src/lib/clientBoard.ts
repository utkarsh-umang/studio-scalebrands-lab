import type {
  AdminBatchFolder,
  AdminVideoTicket,
  VideoPipelineOwner,
} from '@mockData/index'

/** Client-facing Kanban columns (4-bucket model). */
export type ClientBoardColumn =
  | 'yet_to_start'
  | 'in_progress'
  | 'in_review'
  | 'completed'

export type ClientReviewKind = 'clip' | 'idea' | 'text' | 'final'

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
}

function reviewKindFromStage(stageLabel: string): ClientReviewKind | null {
  const s = stageLabel.toLowerCase()
  if (s.includes('clip review')) return 'clip'
  if (s.includes('idea')) return 'idea'
  if (s.includes('text review')) return 'text'
  if (s.includes('final')) return 'final'
  return null
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

export function toClientVideoCard(ticket: AdminVideoTicket): ClientVideoCard {
  return {
    ...ticket,
    clientColumn: deriveClientColumn(ticket.owner, ticket.stageLabel),
    reviewKind: reviewKindFromStage(ticket.stageLabel),
  }
}

export function batchNeedsClientIntake(batch: AdminBatchFolder): boolean {
  if (batch.status !== 'active') return false
  if (!batch.intakePath) return true
  if (batch.intakePath === 'source_media') {
    return !batch.sourceMediaUrl?.trim()
  }
  if (batch.intakePath === 'clips_ready') {
    return !batch.clipsFolderUrl?.trim()
  }
  return true
}

/** @deprecated use batchNeedsClientIntake */
export function batchNeedsFootageIntake(batch: AdminBatchFolder): boolean {
  return batchNeedsClientIntake(batch)
}

/** While clip review is open, only show the batch clip-approval card to the client. */
export function filterVideosForClientKanban(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): AdminVideoTicket[] {
  if (batch.intakePath === 'clips_ready' && batch.clipReviewPhase === 'approved') {
    return videos.filter((v) => v.stageLabel.toLowerCase() !== 'clip review')
  }
  if (
    batch.intakePath === 'source_media' &&
    batch.clipReviewPhase &&
    batch.clipReviewPhase !== 'approved'
  ) {
    return videos.filter((v) => {
      if (v.stageLabel.toLowerCase().includes('clip review')) return true
      return deriveClientColumn(v.owner, v.stageLabel) === 'in_review'
    })
  }
  return videos
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
): Pick<AdminVideoTicket, 'owner' | 'stageLabel' | 'deadlineRole'> {
  const kind = reviewKindFromStage(video.stageLabel)

  if (action === 'approve') {
    switch (kind) {
      case 'clip':
        return {
          owner: 'editor',
          stageLabel: 'Editing in progress',
          deadlineRole: 'editor',
        }
      case 'idea':
        return {
          owner: 'smm',
          stageLabel: 'Awaiting your footage',
          deadlineRole: null,
        }
      case 'text':
        return {
          owner: 'editor',
          stageLabel: 'Editing in progress',
          deadlineRole: 'editor',
        }
      case 'final':
        return {
          owner: 'scheduling',
          stageLabel: 'Scheduling',
          deadlineRole: null,
        }
      default:
        return {
          owner: 'smm',
          stageLabel: 'In progress',
          deadlineRole: 'smm',
        }
    }
  }

  switch (kind) {
    case 'clip':
      return {
        owner: 'smm',
        stageLabel: 'Clip identification',
        deadlineRole: 'smm',
      }
    case 'idea':
      return {
        owner: 'smm',
        stageLabel: 'Idea research',
        deadlineRole: 'smm',
      }
    case 'text':
      return {
        owner: 'smm',
        stageLabel: 'Text creation',
        deadlineRole: 'smm',
      }
    case 'final':
      return {
        owner: 'smm',
        stageLabel: 'SMM QA',
        deadlineRole: 'smm',
      }
    default:
      return {
        owner: 'smm',
        stageLabel: 'In progress',
        deadlineRole: 'smm',
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
