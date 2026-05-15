import type {
  AdminBatchFolder,
  AdminVideoTicket,
  VideoPipelineOwner,
} from '@mockData/index'

/** SMM-facing Kanban columns (4-bucket model). */
export type SmmBoardColumn = 'yet_to_start' | 'in_progress' | 'waiting' | 'completed'

export type SmmWaitingOn = 'client' | 'editor'

export const SMM_BOARD_COLUMNS: {
  id: SmmBoardColumn
  label: string
  hint: string
}[] = [
  {
    id: 'yet_to_start',
    label: 'Yet to start',
    hint: 'New footage — find & cut clips',
  },
  {
    id: 'in_progress',
    label: 'In progress',
    hint: 'Your active work + scheduling',
  },
  {
    id: 'waiting',
    label: 'Waiting',
    hint: 'Client or editor has the ball',
  },
  {
    id: 'completed',
    label: 'Completed',
    hint: 'Scheduled — batch can close',
  },
]

export type SmmVideoCard = AdminVideoTicket & {
  smmColumn: SmmBoardColumn
  waitingOn: SmmWaitingOn | null
}

function waitingOnFromOwner(owner: VideoPipelineOwner): SmmWaitingOn | null {
  if (owner === 'client') return 'client'
  if (owner === 'editor') return 'editor'
  return null
}

/** Map operational owner + stage to the SMM 4-column board. */
export function deriveSmmColumn(
  owner: VideoPipelineOwner,
  stageLabel: string,
): SmmBoardColumn {
  if (owner === 'done') return 'completed'
  if (owner === 'client' || owner === 'editor') return 'waiting'
  if (owner === 'smm' || owner === 'scheduling') return 'in_progress'
  const stage = stageLabel.toLowerCase()
  if (stage.includes('scheduled')) return 'completed'
  return 'in_progress'
}

export function toSmmVideoCard(ticket: AdminVideoTicket): SmmVideoCard {
  const smmColumn = deriveSmmColumn(ticket.owner, ticket.stageLabel)
  return {
    ...ticket,
    smmColumn,
    waitingOn: smmColumn === 'waiting' ? waitingOnFromOwner(ticket.owner) : null,
  }
}

/** Raw-footage path: client shared source; SMM has not submitted clips folder yet. */
export function batchNeedsSmmFindClips(batch: AdminBatchFolder): boolean {
  if (batch.status !== 'active') return false
  if (batch.intakePath === 'clips_ready') return false
  const source = batch.sourceMediaUrl?.trim() || batch.footageUrl?.trim()
  if (!source) return false
  if (batch.clipsFolderUrl?.trim()) return false
  return (
    !batch.clipReviewPhase ||
    batch.clipReviewPhase === 'smm_identifying' ||
    batch.clipReviewPhase === 'with_smm'
  )
}

/** Every deliverable is ready for batch scheduling (client-approved finals). */
export function batchReadyForScheduling(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): boolean {
  if (batch.status !== 'active') return false
  const batchVideos = videos.filter((v) => v.batchId === batch.id)
  if (batchVideos.length === 0) return false
  return batchVideos.every(
    (v) => v.owner === 'scheduling' || v.stageLabel.toLowerCase().includes('scheduling'),
  )
}

/** Editor submitted — SMM should review video + thumbnail. */
export function videoNeedsSmmQa(video: AdminVideoTicket): boolean {
  if (video.owner !== 'smm') return false
  return video.stageLabel.toLowerCase().includes('qa')
}

export function smmStageHint(stageLabel: string): string {
  const s = stageLabel.toLowerCase()
  if (s.includes('clip')) return 'Clips'
  if (s.includes('text')) return 'Titles'
  if (s.includes('qa')) return 'QA'
  if (s.includes('scheduling')) return 'Schedule'
  if (s.includes('edit')) return 'With editor'
  if (s.includes('final')) return 'Client final'
  return stageLabel
}

export type SmmBatchAttention = {
  batchId: string
  batchTitle: string
  clientName: string
  kind: 'find_clips' | 'schedule' | 'video_qa'
  videoId?: string
  videoTitle?: string
}

export function listSmmBatchAttention(
  batches: AdminBatchFolder[],
  videos: AdminVideoTicket[],
  clientNameById: Map<string, string>,
): SmmBatchAttention[] {
  const items: SmmBatchAttention[] = []
  for (const batch of batches) {
    if (batch.status !== 'active') continue
    const clientName = clientNameById.get(batch.clientId) ?? 'Client'
    if (batchNeedsSmmFindClips(batch)) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'find_clips',
      })
    } else if (batchReadyForScheduling(batch, videos)) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'schedule',
      })
    }

    const qaVideos = videos.filter(
      (v) => v.batchId === batch.id && videoNeedsSmmQa(v),
    )
    for (const v of qaVideos) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'video_qa',
        videoId: v.id,
        videoTitle: v.title,
      })
    }
  }
  return items
}
