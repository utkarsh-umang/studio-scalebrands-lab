import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { readinessForDeliverable } from '@/lib/pathBDeliverables'
import { getManifestForBatch } from '@/lib/driveMedia'

/** Path B SMM deliverables board — four workflow columns. */
export type SmmPathBColumn = 'identify' | 'your_queue' | 'waiting' | 'schedule'

export const SMM_PATH_B_COLUMNS: {
  id: SmmPathBColumn
  label: string
  hint: string
}[] = [
  {
    id: 'identify',
    label: 'Clip identification',
    hint: 'Submit numbered clips folder for client',
  },
  {
    id: 'your_queue',
    label: 'Your queue',
    hint: 'SMM QA, client revisions, thumb/title',
  },
  {
    id: 'waiting',
    label: 'Waiting',
    hint: 'Client or editor',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    hint: 'Set go-live per video',
  },
]

export type SmmBatchKanbanPhase = 'identifying' | 'pre_split' | 'post_split'

export function smmBatchKanbanPhase(batch: AdminBatchFolder): SmmBatchKanbanPhase {
  if (batchNeedsSmmFindClips(batch)) return 'identifying'
  if (!batch.editorDeliverablesDriveUrl?.trim()) return 'pre_split'
  return 'post_split'
}

/** Post-split indexed deliverables only (path-b-ui-spec.md §6). */
export function filterVideosForSmmKanban(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): AdminVideoTicket[] {
  const phase = smmBatchKanbanPhase(batch)
  if (phase !== 'post_split') return []
  return videos.filter(
    (v) => v.batchId === batch.id && v.deliverableIndex != null && v.deliverableIndex > 0,
  )
}

export function videoNeedsSmmQa(video: AdminVideoTicket): boolean {
  if (video.owner !== 'smm') return false
  return video.stageLabel.toLowerCase().includes('smm qa')
}

export function videoNeedsSmmClientRevision(video: AdminVideoTicket): boolean {
  if (video.owner !== 'smm') return false
  const stage = video.stageLabel.toLowerCase()
  return (
    stage.includes('client revision') ||
    (video.lastRevisionRequestedBy === 'client' && stage.includes('revision'))
  )
}

/** SMM owns production-stage asset prep (before returning to SMM QA). */
export function smmInAssetPrepFlow(video: AdminVideoTicket): boolean {
  if (video.owner !== 'smm') return false
  const stage = video.stageLabel.toLowerCase()
  return (
    stage.includes('production') || stage.includes('thumbnail') || stage.includes('title')
  )
}

/** SMM updates thumb/title on Drive before re-entering SMM QA. */
export function smmNeedsAssetPrep(
  video: AdminVideoTicket,
  batch: AdminBatchFolder,
): boolean {
  if (video.owner !== 'smm') return false
  const stage = video.stageLabel.toLowerCase()
  if (!stage.includes('production') && !stage.includes('thumbnail') && !stage.includes('title')) {
    return false
  }
  const manifest = getManifestForBatch(batch.id)
  const index = video.deliverableIndex ?? 1
  const readiness = readinessForDeliverable(batch.id, index, video, manifest)
  return !readiness.allReady
}

/** SMM may set title (and sync thumb on Drive) while editor still owns production. */
export function smmCanEditEditorDeliverable(
  video: AdminVideoTicket,
  batch: AdminBatchFolder,
): boolean {
  if (video.owner !== 'editor') return false
  const stage = video.stageLabel.toLowerCase()
  if (stage.includes('qa flagged')) return false
  if (
    !stage.includes('production') &&
    !stage.includes('thumbnail') &&
    !stage.includes('title')
  ) {
    return false
  }
  const manifest = getManifestForBatch(batch.id)
  const index = video.deliverableIndex ?? 1
  const readiness = readinessForDeliverable(batch.id, index, video, manifest)
  return !readiness.titleReady || !readiness.thumbnailReady
}

export function videoNeedsSmmSchedule(video: AdminVideoTicket): boolean {
  return video.owner === 'scheduling'
}

export function smmCardActionable(
  video: AdminVideoTicket,
  batch: AdminBatchFolder,
): boolean {
  return (
    videoNeedsSmmQa(video) ||
    videoNeedsSmmClientRevision(video) ||
    smmNeedsAssetPrep(video, batch) ||
    smmCanEditEditorDeliverable(video, batch) ||
    videoNeedsSmmSchedule(video)
  )
}

export function deriveSmmPathBColumn(
  video: AdminVideoTicket,
  batch: AdminBatchFolder,
): SmmPathBColumn {
  if (smmBatchKanbanPhase(batch) === 'identifying') return 'identify'
  if (video.owner === 'scheduling' || video.owner === 'done') return 'schedule'
  if (
    videoNeedsSmmQa(video) ||
    videoNeedsSmmClientRevision(video) ||
    smmNeedsAssetPrep(video, batch) ||
    smmCanEditEditorDeliverable(video, batch)
  ) {
    return 'your_queue'
  }
  return 'waiting'
}

export type SmmPathBVideoCard = AdminVideoTicket & {
  pathBColumn: SmmPathBColumn
}

export function toSmmPathBVideoCard(
  ticket: AdminVideoTicket,
  batch: AdminBatchFolder,
): SmmPathBVideoCard {
  return {
    ...ticket,
    pathBColumn: deriveSmmPathBColumn(ticket, batch),
  }
}

/** Podcast path — team still identifying / uploading numbered clips folder. */
export function batchNeedsClipIdentification(batch: AdminBatchFolder): boolean {
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

/** Raw-footage path: client shared source; SMM has not submitted clips folder yet. */
export function batchNeedsSmmFindClips(batch: AdminBatchFolder): boolean {
  return batchNeedsClipIdentification(batch)
}

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

export function batchReadyForSmmClose(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): boolean {
  if (batch.status !== 'active' || batch.creditsDebited) return false
  const batchVideos = videos.filter((v) => v.batchId === batch.id)
  if (batchVideos.length === 0) return false
  return batchVideos.every((v) => v.owner === 'done')
}

export function smmBatchFolderHint(
  batch: AdminBatchFolder,
  videos: AdminVideoTicket[],
): string {
  const phase = smmBatchKanbanPhase(batch)
  if (phase === 'identifying') return 'Submit clips folder'
  if (phase === 'pre_split') {
    if (batch.clipReviewPhase === 'awaiting_client') return 'Client reviewing clips'
    return 'Pre-split — clips on Drive'
  }
  const batchVideos = filterVideosForSmmKanban(batch, videos)
  const qa = batchVideos.filter(videoNeedsSmmQa).length
  const rev = batchVideos.filter(videoNeedsSmmClientRevision).length
  if (qa > 0) return `${qa} in SMM QA`
  if (rev > 0) return `${rev} client revision${rev === 1 ? '' : 's'}`
  const toSchedule = batchVideos.filter((v) => v.owner === 'scheduling').length
  if (toSchedule > 0) {
    return `${toSchedule} to schedule`
  }
  const allDone =
    batchVideos.length > 0 && batchVideos.every((v) => v.owner === 'done')
  if (allDone) return 'All videos scheduled'
  return `${batchVideos.length} deliverable${batchVideos.length === 1 ? '' : 's'}`
}

export type SmmAttentionItem = {
  batchId: string
  batchTitle: string
  clientName: string
  kind:
    | 'find_clips'
    | 'video_qa'
    | 'client_revision'
    | 'editor_deliverable'
    | 'schedule'
    | 'view_clips'
  videoId?: string
  count?: number
}

export function listSmmAttention(
  batches: AdminBatchFolder[],
  videos: AdminVideoTicket[],
  clientNameById: Map<string, string>,
): SmmAttentionItem[] {
  const items: SmmAttentionItem[] = []

  for (const batch of batches) {
    if (batch.status !== 'active') continue
    const clientName = clientNameById.get(batch.clientId) ?? 'Client'
    const phase = smmBatchKanbanPhase(batch)

    if (batchNeedsSmmFindClips(batch)) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'find_clips',
      })
      continue
    }

    if (phase === 'pre_split' && batch.clipsFolderUrl?.trim()) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'view_clips',
      })
    }

    const batchVideos = filterVideosForSmmKanban(batch, videos)

    for (const ticket of batchVideos.filter((v) => v.owner === 'scheduling')) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'schedule',
        videoId: ticket.id,
      })
    }
    const qaTickets = batchVideos.filter(videoNeedsSmmQa)
    if (qaTickets.length > 0) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'video_qa',
        videoId: qaTickets[0]?.id,
        count: qaTickets.length,
      })
    }

    const revisionTickets = batchVideos.filter(videoNeedsSmmClientRevision)
    if (revisionTickets.length > 0) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'client_revision',
        videoId: revisionTickets[0]?.id,
        count: revisionTickets.length,
      })
    }

    const editorAssist = batchVideos.filter((v) =>
      smmCanEditEditorDeliverable(v, batch),
    )
    if (editorAssist.length > 0) {
      items.push({
        batchId: batch.id,
        batchTitle: batch.title,
        clientName,
        kind: 'editor_deliverable',
        videoId: editorAssist[0]?.id,
        count: editorAssist.length,
      })
    }
  }

  return items
}
