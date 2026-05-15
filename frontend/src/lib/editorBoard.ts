import type {
  AdminBatchFolder,
  AdminVideoTicket,
  EditorWorkflowPhase,
  VideoPipelineOwner,
} from '@mockData/index'

/** Editor deliverables board — three workflow columns. */
export type EditorBoardColumn =
  | 'videos_created'
  | 'thumbnails_created'
  | 'video_titles'

export const EDITOR_BOARD_COLUMNS: {
  id: EditorBoardColumn
  label: string
  hint: string
}[] = [
  {
    id: 'videos_created',
    label: 'Videos created',
    hint: 'Upload finals to Drive · share link for QA',
  },
  {
    id: 'thumbnails_created',
    label: 'Thumbnails created',
    hint: 'Thumbnails folder · client QA',
  },
  {
    id: 'video_titles',
    label: 'Video titles',
    hint: 'Set titles · hand folder to SMM',
  },
]

export type EditorWaitingOn = 'smm' | 'client'

export type EditorVideoCard = AdminVideoTicket & {
  editorColumn: EditorBoardColumn
  waitingOn: EditorWaitingOn | null
}

function phaseToColumn(phase: EditorWorkflowPhase): EditorBoardColumn {
  switch (phase) {
    case 'videos':
      return 'videos_created'
    case 'thumbnails':
      return 'thumbnails_created'
    case 'titles':
    case 'handed_off':
      return 'video_titles'
    default: {
      const _exhaustive: never = phase
      return _exhaustive
    }
  }
}

function waitingOnFromOwner(owner: VideoPipelineOwner): EditorWaitingOn | null {
  if (owner === 'smm') return 'smm'
  if (owner === 'client') return 'client'
  return null
}

export function deriveEditorColumn(
  video: AdminVideoTicket,
): EditorBoardColumn {
  const phase = video.editorPhase ?? 'videos'
  if (phase === 'handed_off') return 'video_titles'
  return phaseToColumn(phase)
}

export function toEditorVideoCard(ticket: AdminVideoTicket): EditorVideoCard {
  const editorColumn = deriveEditorColumn(ticket)
  const waitingOn =
    ticket.editorPhase === 'handed_off'
      ? null
      : waitingOnFromOwner(ticket.owner)
  return {
    ...ticket,
    editorColumn,
    waitingOn:
      editorColumn && waitingOn && ticket.owner !== 'editor' ? waitingOn : null,
  }
}

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

/** Hide clip-identification tickets from the deliverables board. */
export function filterVideosForEditorKanban(
  videos: AdminVideoTicket[],
): AdminVideoTicket[] {
  return videos.filter((v) => {
    const stage = v.stageLabel.toLowerCase()
    if (stage.includes('clip identification')) return false
    if (stage.includes('clip review') && !v.editorPhase) return false
    if (v.editorPhase === 'handed_off') return false
    return (
      v.editorPhase != null ||
      v.owner === 'editor' ||
      (v.owner === 'smm' && stage.includes('qa')) ||
      (v.owner === 'client' &&
        (stage.includes('final') || stage.includes('thumbnail')))
    )
  })
}

export function videoNeedsEditorVideosSubmit(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): boolean {
  if (!batchReadyForEditorWork(batch)) return false
  if (batch.editorDeliverablesDriveUrl?.trim()) return false
  const batchVideos = videos.filter((v) => v.batchId === batch.id)
  const work = filterVideosForEditorKanban(batchVideos)
  if (work.length === 0) return true
  return work.some((v) => (v.editorPhase ?? 'videos') === 'videos')
}

export function videoNeedsEditorThumbnailsSubmit(
  video: AdminVideoTicket,
): boolean {
  return (
    video.editorPhase === 'thumbnails' &&
    video.owner === 'editor' &&
    !video.stageLabel.toLowerCase().includes('thumbnail review')
  )
}

export function videoNeedsEditorTitleSubmit(video: AdminVideoTicket): boolean {
  return (
    video.editorPhase === 'titles' &&
    video.owner === 'editor' &&
    !video.editorPublishTitle?.trim()
  )
}

export function videoEditorQaReturn(video: AdminVideoTicket): boolean {
  return (
    (video.editorPhase ?? 'videos') === 'videos' &&
    video.owner === 'editor' &&
    video.stageLabel.toLowerCase().includes('qa flagged')
  )
}

export function editorStageHint(video: EditorVideoCard): string {
  const stage = video.stageLabel.toLowerCase()
  if (video.editorPhase === 'handed_off') return 'With SMM'
  if (stage.includes('qa flagged')) return 'Fix QA flags'
  if (stage.includes('smm qa')) return 'SMM reviewing video'
  if (stage.includes('final')) return 'Client reviewing video'
  if (stage.includes('thumbnail review')) return 'Client reviewing thumb'
  if (stage.includes('thumbnail')) return 'Upload thumbnails'
  if (stage.includes('title')) return 'Set publish title'
  if (video.waitingOn === 'smm') return 'Waiting on SMM'
  if (video.waitingOn === 'client') return 'Waiting on client'
  return 'Your turn'
}

export type EditorAttentionItem = {
  batchId: string
  batchTitle: string
  clientName: string
  kind:
    | 'share_videos_drive'
    | 'qa_fix'
    | 'thumbnails_ready'
    | 'set_title'
  videoId?: string
  videoTitle?: string
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

    if (videoNeedsEditorVideosSubmit(batch, batchVideos)) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'share_videos_drive',
      })
    }

    for (const v of filterVideosForEditorKanban(batchVideos)) {
      if (videoEditorQaReturn(v)) {
        items.push({
          batchId: batch.id,
          batchTitle: batch.title,
          clientName,
          kind: 'qa_fix',
          videoId: v.id,
          videoTitle: v.title,
        })
      } else if (videoNeedsEditorThumbnailsSubmit(v)) {
        items.push({
          batchId: batch.id,
          batchTitle: batch.title,
          clientName,
          kind: 'thumbnails_ready',
          videoId: v.id,
          videoTitle: v.title,
        })
      } else if (videoNeedsEditorTitleSubmit(v)) {
        items.push({
          batchId: batch.id,
          batchTitle: batch.title,
          clientName,
          kind: 'set_title',
          videoId: v.id,
          videoTitle: v.title,
        })
      }
    }
  }

  return items
}

export function batchSubtitle(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): string {
  if (batchAwaitingClips(batch)) return 'Waiting — clips not approved yet'
  if (!batchReadyForEditorWork(batch)) return 'Not ready for deliverables'
  if (videoNeedsEditorVideosSubmit(batch, videos)) return 'Share videos Drive link'
  const work = filterVideosForEditorKanban(
    videos.filter((v) => v.batchId === batch.id),
  )
  const titles = work.filter((v) => v.editorPhase === 'titles').length
  const thumbs = work.filter((v) => v.editorPhase === 'thumbnails').length
  if (titles > 0) return `${titles} need title${titles === 1 ? '' : 's'}`
  if (thumbs > 0) return `${thumbs} in thumbnails`
  return `Updated ${batch.updatedAt.slice(0, 10)}`
}
