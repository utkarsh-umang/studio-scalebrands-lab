import type {
  AdminBatchFolder,
  AdminClientProfile,
  AdminVideoTicket,
} from '@/types/pathB'
import type {
  AdminDeadlineTask,
  AdminPipelineItem,
  AdminPipelineSummary,
  PipelineOwnerKind,
} from '@/types/pathB'
import { batchNeedsClientIntake } from '@/lib/clientBoard'
import { batchNeedsSmmFindClips } from '@/lib/smmBoard'

export type { AdminPipelineSummary, AdminPipelineItem, PipelineOwnerKind }

const OWNER_ORDER: PipelineOwnerKind[] = ['client', 'smm', 'editor']

function isActiveBatch(batch: AdminBatchFolder): boolean {
  return batch.status === 'active'
}

/** Dominant owner for an active batch (Path B rollup). */
export function pipelineOwnerForBatch(
  batch: AdminBatchFolder,
  batchVideos: AdminVideoTicket[],
): PipelineOwnerKind {
  if (batchNeedsClientIntake(batch)) return 'client'
  if (batchNeedsSmmFindClips(batch)) return 'smm'

  const open = batchVideos.filter(
    (v) =>
      v.owner === 'client' ||
      v.owner === 'smm' ||
      v.owner === 'editor',
  )

  if (open.length === 0) {
    if (!batch.editorDeliverablesDriveUrl?.trim()) {
      if (batch.clipReviewPhase === 'awaiting_client') return 'client'
      if (batch.clipReviewPhase === 'approved') return 'editor'
      return 'smm'
    }
    return 'smm'
  }

  const counts: Record<PipelineOwnerKind, number> = {
    client: 0,
    smm: 0,
    editor: 0,
  }
  for (const v of open) {
    if (v.owner === 'client' || v.owner === 'smm' || v.owner === 'editor') {
      counts[v.owner] += 1
    }
  }

  let best: PipelineOwnerKind = 'client'
  let bestCount = -1
  for (const key of OWNER_ORDER) {
    if (counts[key] > bestCount) {
      bestCount = counts[key]
      best = key
    }
  }
  return best
}

function stageLabelForBatch(
  batch: AdminBatchFolder,
  batchVideos: AdminVideoTicket[],
): string {
  if (batch.demoStage) {
    return batch.demoStage.replace(/_/g, ' ')
  }
  const open = batchVideos.filter(
    (v) => v.owner !== 'done' && v.owner !== 'scheduling',
  )
  if (open.length === 1) return open[0]!.stageLabel
  if (open.length > 1) {
    const owners = new Set(open.map((v) => v.owner))
    if (owners.size > 1) return 'Mixed stages'
  }
  if (batchNeedsClientIntake(batch)) return 'Awaiting client intake'
  if (batchNeedsSmmFindClips(batch)) return 'Clip identification'
  return 'In progress'
}

export function computeAdminPipelineSummary(
  batches: AdminBatchFolder[],
  videos: AdminVideoTicket[],
): AdminPipelineSummary {
  const summary: AdminPipelineSummary = {
    withClient: 0,
    withSmm: 0,
    withEditor: 0,
  }

  for (const batch of batches) {
    if (!isActiveBatch(batch)) continue
    const batchVideos = videos.filter((v) => v.batchId === batch.id)
    const owner = pipelineOwnerForBatch(batch, batchVideos)
    if (owner === 'client') summary.withClient += 1
    else if (owner === 'smm') summary.withSmm += 1
    else summary.withEditor += 1
  }

  return summary
}

export function listAdminPipelineItems(
  batches: AdminBatchFolder[],
  videos: AdminVideoTicket[],
  clients: AdminClientProfile[],
): AdminPipelineItem[] {
  const clientById = new Map(clients.map((c) => [c.id, c]))

  return batches
    .filter(isActiveBatch)
    .map((batch) => {
      const batchVideos = videos.filter((v) => v.batchId === batch.id)
      const client = clientById.get(batch.clientId)
      return {
        id: batch.id,
        clientId: batch.clientId,
        batchTitle: batch.title,
        clientLabel: client?.displayName ?? 'Client',
        owner: pipelineOwnerForBatch(batch, batchVideos),
        stageLabel: stageLabelForBatch(batch, batchVideos),
        updatedAt: batch.updatedAt,
      }
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function listAdminDeadlineTasks(
  batches: AdminBatchFolder[],
  videos: AdminVideoTicket[],
  clients: AdminClientProfile[],
): AdminDeadlineTask[] {
  const batchById = new Map(batches.map((b) => [b.id, b]))
  const clientById = new Map(clients.map((c) => [c.id, c]))

  return videos
    .filter((v) => {
      const batch = batchById.get(v.batchId)
      if (!batch || batch.status !== 'active') return false
      return v.deadlineRole === 'smm' || v.deadlineRole === 'editor'
    })
    .map((v) => {
      const batch = batchById.get(v.batchId)!
      const client = clientById.get(v.clientId)
      const role = v.deadlineRole as 'smm' | 'editor'
      const assigneeName =
        role === 'smm'
          ? (client?.assignedSmmName ?? 'SMM')
          : (client?.assignedEditorName ?? 'Editor')
      const index =
        v.deliverableIndex != null && v.deliverableIndex > 0
          ? ` #${v.deliverableIndex}`
          : ''
      return {
        id: v.id,
        batchId: batch.id,
        batchTitle: batch.title,
        clientLabel: client?.displayName ?? 'Client',
        assigneeRole: role,
        assigneeName,
        taskLabel: `${v.title}${index} · ${v.stageLabel}`,
        dueAt: v.deadlineAt,
        updatedAt: batch.updatedAt,
      }
    })
    .sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return 0
      if (!a.dueAt) return 1
      if (!b.dueAt) return -1
      return a.dueAt.localeCompare(b.dueAt)
    })
}
