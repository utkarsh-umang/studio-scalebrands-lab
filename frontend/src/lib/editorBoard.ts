import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'

/** Batch is on the editor's desk (clips approved or client sent clips folder). */
export function batchReadyForEditorWork(batch: AdminBatchFolder): boolean {
  if (batch.status !== 'active') return false
  if (batch.intakePath === 'clips_ready') {
    return Boolean(batch.clipsFolderUrl?.trim())
  }
  return batch.clipReviewPhase === 'approved'
}

export function batchAwaitingClips(batch: AdminBatchFolder): boolean {
  if (batch.status !== 'active') return false
  if (batch.intakePath === 'clips_ready') return false
  return batch.clipReviewPhase !== 'approved'
}

export type EditorBatchKanbanPhase = 'awaiting_clips' | 'pre_split' | 'post_split'

export function editorBatchKanbanPhase(batch: AdminBatchFolder): EditorBatchKanbanPhase {
  if (batchAwaitingClips(batch)) return 'awaiting_clips'
  if (!batch.editorDeliverablesDriveUrl?.trim()) return 'pre_split'
  return 'post_split'
}

function isPreSplitGateTicket(video: AdminVideoTicket): boolean {
  return video.deliverableIndex == null || video.deliverableIndex < 1
}

/** Path B editor kanban columns */
export type EditorPathBColumn = 'setup' | 'production' | 'in_qa' | 'done'

export const EDITOR_PATH_B_COLUMNS: {
  id: EditorPathBColumn
  label: string
  hint: string
}[] = [
  { id: 'setup', label: 'Setup', hint: 'Clips + deliverables folder' },
  { id: 'production', label: 'Production', hint: 'Upload video, thumb, title' },
  { id: 'in_qa', label: 'In QA', hint: 'SMM or client review' },
  { id: 'done', label: 'Done', hint: 'Scheduled' },
]

export function deriveEditorPathBColumn(
  video: AdminVideoTicket,
  batch: AdminBatchFolder,
): EditorPathBColumn {
  const phase = editorBatchKanbanPhase(batch)
  if (phase === 'pre_split') return 'setup'
  if (video.owner === 'done' || video.owner === 'scheduling') return 'done'
  if (videoEditorQaReturn(video)) return 'production'
  if (video.owner === 'editor') {
    const stage = video.stageLabel.toLowerCase()
    if (stage.includes('production') || stage.includes('thumbnail') || stage.includes('title')) {
      return 'production'
    }
    return 'production'
  }
  if (video.owner === 'smm' || video.owner === 'client') return 'in_qa'
  return 'production'
}

export type EditorPathBVideoCard = AdminVideoTicket & {
  pathBColumn: EditorPathBColumn
}

export function toEditorPathBVideoCard(
  ticket: AdminVideoTicket,
  batch: AdminBatchFolder,
): EditorPathBVideoCard {
  return {
    ...ticket,
    pathBColumn: deriveEditorPathBColumn(ticket, batch),
  }
}

/**
 * Path B kanban rules — awaiting clips: 0 cards; pre-split: one gate; post-split: n indexed cards.
 */
export function filterVideosForEditorKanban(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): AdminVideoTicket[] {
  const batchVideos = videos.filter((v) => v.batchId === batch.id)
  const phase = editorBatchKanbanPhase(batch)

  if (phase === 'awaiting_clips') return []

  if (phase === 'pre_split') {
    return batchVideos
      .filter(isPreSplitGateTicket)
      .filter((v) => !v.stageLabel.toLowerCase().includes('clip review'))
  }

  return batchVideos.filter(
    (v) => v.deliverableIndex != null && v.deliverableIndex > 0,
  )
}

export function videoNeedsEditorVideosSubmit(
  batch: AdminBatchFolder,
  _videos?: AdminVideoTicket[],
): boolean {
  if (!batchReadyForEditorWork(batch)) return false
  return !batch.editorDeliverablesDriveUrl?.trim()
}

export function editorNeedsProductionWork(video: AdminVideoTicket): boolean {
  if (video.owner !== 'editor') return false
  if (videoEditorQaReturn(video)) return true
  const stage = video.stageLabel.toLowerCase()
  return stage.includes('production') || stage.includes('thumbnail') || stage.includes('title')
}

export function videoEditorQaReturn(video: AdminVideoTicket): boolean {
  return (
    (video.editorPhase ?? 'videos') === 'videos' &&
    video.owner === 'editor' &&
    video.stageLabel.toLowerCase().includes('qa flagged')
  )
}

export type EditorAttentionItem = {
  batchId: string
  batchTitle: string
  clientName: string
  kind: 'find_clips' | 'submit_deliverables' | 'qa_fix' | 'production' | 'pre_split_gate'
  videoId?: string
  count?: number
}

/** Same rules as SMM — podcast path before clips folder is linked. */
export function batchNeedsEditorFindClips(batch: AdminBatchFolder): boolean {
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

export function listEditorAttention(
  batches: AdminBatchFolder[],
  videos: AdminVideoTicket[],
  clientNameById: Map<string, string>,
): EditorAttentionItem[] {
  const items: EditorAttentionItem[] = []

  for (const batch of batches) {
    if (batch.status !== 'active') continue
    const clientName = clientNameById.get(batch.clientId) ?? 'Client'
    const batchVideos = videos.filter((v) => v.batchId === batch.id)

    if (batchNeedsEditorFindClips(batch)) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'find_clips',
      })
      continue
    }

    const phase = editorBatchKanbanPhase(batch)

    if (phase === 'pre_split' && videoNeedsEditorVideosSubmit(batch)) {
      const gate = filterVideosForEditorKanban(batch, batchVideos)[0]
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: gate ? 'pre_split_gate' : 'submit_deliverables',
        videoId: gate?.id,
      })
      continue
    }

    const work = filterVideosForEditorKanban(batch, batchVideos)

    const qaTickets = work.filter(videoEditorQaReturn)
    for (const t of qaTickets) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'qa_fix',
        videoId: t.id,
      })
    }

    const prodCount = work.filter(editorNeedsProductionWork).length
    if (prodCount > 0) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'production',
        count: prodCount,
      })
    }
  }

  return items
}

export function batchSubtitle(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): string {
  if (batchNeedsEditorFindClips(batch)) return 'Find clips — submit numbered folder'
  if (batchAwaitingClips(batch)) return 'Waiting — clips not approved yet'
  if (!batchReadyForEditorWork(batch)) return 'Not ready for deliverables'
  if (videoNeedsEditorVideosSubmit(batch, videos)) return 'Share videos Drive link'
  const work = filterVideosForEditorKanban(batch, videos)
  const prod = work.filter(editorNeedsProductionWork).length
  if (prod > 0) return `${prod} in production`
  return `Updated ${batch.updatedAt.slice(0, 10)}`
}

/** Card hint for batch-centric editor board */
export function editorBatchPhaseLabel(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): string {
  const vs = videos.filter((v) => v.batchId === batch.id)
  if (batch.status === 'completed') return 'Completed — see archive'
  if (batchNeedsEditorFindClips(batch)) return 'Your turn — find clips'
  if (batchAwaitingClips(batch)) return 'Waiting on clips / client'
  if (!batchReadyForEditorWork(batch)) return 'Not ready'
  if (!batch.editorDeliverablesDriveUrl?.trim())
    return 'Your turn — submit deliverables folder'
  if (vs.some(videoEditorQaReturn)) return 'Your turn — QA fixes'
  if (vs.some(editorNeedsProductionWork)) return 'Your turn — production'
  if (vs.length > 0 && vs.every((v) => v.owner !== 'editor'))
    return 'Waiting on SMM or client'
  return 'In progress'
}
