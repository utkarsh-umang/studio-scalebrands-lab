import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'

/** SMM-facing pipeline columns (active board — “completed” lives in the sidebar only). */
export type SmmBoardColumn = 'yet_to_start' | 'in_progress' | 'waiting'

/** Demo batch → which body to render inside the batch modal (prototype). */
export type SmmBatchDetailMode =
  | 'find_clips'
  | 'smm_qa_client_style'
  | 'titles_handoff'
  | 'observe_client_final'
  | 'observe_thumbnails'
  | 'observe_editor_cutting'
  | 'waiting_generic'

const SMM_BATCH_DETAIL_MODE: Record<string, SmmBatchDetailMode> = {
  'b-yet': 'find_clips',
  'b-smm-qa': 'smm_qa_client_style',
  'b-titles': 'titles_handoff',
  'b-obs-final': 'observe_client_final',
  'b-obs-thumb': 'observe_thumbnails',
  'b-obs-edit': 'observe_editor_cutting',
}

export function getSmmBatchDetailMode(batchId: string): SmmBatchDetailMode {
  return SMM_BATCH_DETAIL_MODE[batchId] ?? 'waiting_generic'
}

/** Who/what the batch is waiting on when not in SMM QA. */
export type SmmWaitingOn =
  | 'client'
  | 'editor'
  | 'scheduling'
  | 'editor_titles'

export const SMM_BOARD_COLUMNS: {
  id: SmmBoardColumn
  label: string
  hint: string
}[] = [
  {
    id: 'yet_to_start',
    label: 'Yet to start',
    hint: 'Source link + Drive folder to Scale Brands reader',
  },
  {
    id: 'in_progress',
    label: 'In progress',
    hint: 'Your QA or titles prep',
  },
  {
    id: 'waiting',
    label: 'Waiting',
    hint: 'Client, editor, or observer-only steps',
  },
]

export type SmmVideoCard = AdminVideoTicket & {
  smmColumn: SmmBoardColumn
  waitingOn: SmmWaitingOn | null
}

/** Editor submitted — SMM should review video (QA stage). */
export function videoNeedsSmmQa(video: AdminVideoTicket): boolean {
  if (video.owner !== 'smm') return false
  return video.stageLabel.toLowerCase().includes('qa')
}

function deriveSmmWaitingOn(
  ticket: AdminVideoTicket,
  smmColumn: SmmBoardColumn,
): SmmWaitingOn | null {
  if (smmColumn !== 'waiting') return null
  const stage = ticket.stageLabel.toLowerCase()
  if (ticket.owner === 'scheduling') return 'scheduling'
  if (ticket.owner === 'smm' && stage.includes('handoff')) return 'editor_titles'
  if (ticket.owner === 'client') return 'client'
  if (ticket.owner === 'editor') return 'editor'
  return null
}

/** Map operational owner + stage to the SMM 4-column board. */
export function deriveSmmColumn(ticket: AdminVideoTicket): SmmBoardColumn {
  const { owner, stageLabel } = ticket
  const stage = stageLabel.toLowerCase()
  if (owner === 'done' || stage.includes('scheduled')) return 'waiting'
  if (owner === 'client' || owner === 'editor') return 'waiting'
  if (owner === 'scheduling') return 'waiting'
  if (owner === 'smm') {
    if (videoNeedsSmmQa(ticket)) return 'in_progress'
    if (
      stage.includes('clip identification') ||
      stage.includes('identifying')
    ) {
      return 'yet_to_start'
    }
    if (stage.includes('handoff')) return 'waiting'
    return 'in_progress'
  }
  return 'in_progress'
}

export function toSmmVideoCard(ticket: AdminVideoTicket): SmmVideoCard {
  const smmColumn = deriveSmmColumn(ticket)
  return {
    ...ticket,
    smmColumn,
    waitingOn: deriveSmmWaitingOn(ticket, smmColumn),
  }
}

/** Batch-level column (one card per batch on the SMM board). */
export function deriveSmmBatchColumn(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): SmmBoardColumn {
  if (batch.status !== 'active') return 'waiting'

  if (batch.id === 'b-titles') return 'in_progress'

  if (batchNeedsSmmFindClips(batch)) return 'yet_to_start'

  const batchVideos = videos.filter((v) => v.batchId === batch.id)

  if (batchVideos.some((v) => videoNeedsSmmQa(v))) return 'in_progress'

  /** Posted but batch still open — close from Completed in the sidebar, not here. */
  if (batchReadyForSmmClose(batch, videos)) return 'waiting'

  if (batchReadyForScheduling(batch, videos)) return 'waiting'

  if (
    batchVideos.length > 0 &&
    batchVideos.every((v) => deriveSmmColumn(v) === 'waiting')
  ) {
    return 'waiting'
  }

  if (batchVideos.some((v) => deriveSmmColumn(v) === 'in_progress')) {
    return 'in_progress'
  }

  return 'waiting'
}

/** Active batches that should appear on the three-column pipeline (not “close batch” parking). */
export function batchAppearsOnSmmPipelineBoard(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): boolean {
  if (batch.status !== 'active') return false
  if (batchReadyForSmmClose(batch, videos)) return false
  return true
}

/** One-line status for a batch card subtitle. */
export function smmBatchCardSubtitle(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): string {
  const col = deriveSmmBatchColumn(batch, videos)
  const n = videos.filter((v) => v.batchId === batch.id).length
  const countLabel = n === 1 ? '1 video' : `${n} videos`

  if (col === 'yet_to_start') return 'Submit clips folder (reader shared)'
  if (col === 'in_progress') {
    if (batch.id === 'b-titles')
      return `${countLabel} · titles from editor — your prep`
    return `${countLabel} · SMM video QA`
  }
  if (batchReadyForScheduling(batch, videos)) {
    return `${countLabel} · ready to publish on platforms`
  }
  if (batch.id === 'b-obs-final') return `${countLabel} · client on final video QA`
  if (batch.id === 'b-obs-thumb') return `${countLabel} · thumbnail approvals`
  if (batch.id === 'b-obs-edit')
    return `${countLabel} · with editor (clips approved)`
  return `${countLabel} · with client or editor`
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

/** All deliverables are scheduled (owner done); SMM can close the batch and debit credits. */
export function batchReadyForSmmClose(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): boolean {
  if (batch.status !== 'active' || batch.creditsDebited) return false
  const batchVideos = videos.filter((v) => v.batchId === batch.id)
  if (batchVideos.length === 0) return false
  return batchVideos.every((v) => v.owner === 'done')
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
    } else if (
      batchReadyForScheduling(batch, videos) &&
      batch.id !== 'b-titles'
    ) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'schedule',
      })
    }

    const batchNeedsQa =
      videos.some((v) => v.batchId === batch.id && videoNeedsSmmQa(v)) &&
      deriveSmmBatchColumn(batch, videos) === 'in_progress'
    if (batchNeedsQa) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'video_qa',
      })
    }
  }
  return items
}
