import type { PathBDemoStage } from '@mockData/pathBDemoScenarios'
import { getPathBDemoStageLabel } from '@mockData/pathBDemoScenarios'
import type {
  AdminBatchFolder,
  AdminVideoTicket,
  BatchClipReviewPhase,
  BatchIntakePath,
  VideoPipelineOwner,
} from '@mockData/index'

/** Canonical video fields set on every Path B transition (Epic 6). */
export type PathBVideoState = Pick<
  AdminVideoTicket,
  | 'owner'
  | 'stageLabel'
  | 'deadlineRole'
  | 'demoStage'
  | 'editorPhase'
  | 'releasedToClientFinalVideoReview'
>

export function ownerForDemoStage(stage: PathBDemoStage): VideoPipelineOwner {
  switch (stage) {
    case 'clip_client_review':
    case 'client_qa':
      return 'client'
    case 'clips_identifying':
    case 'smm_qa':
    case 'revision_via_smm':
      return 'smm'
    case 'editor_fix':
    case 'production':
    case 'pre_split_production':
    case 'clips_ready_intake':
      return 'editor'
    case 'scheduling':
      return 'scheduling'
    case 'completed':
      return 'done'
    default:
      return 'smm'
  }
}

export function deadlineRoleForOwner(
  owner: VideoPipelineOwner,
): AdminVideoTicket['deadlineRole'] {
  if (owner === 'smm') return 'smm'
  if (owner === 'editor') return 'editor'
  return null
}

export function videoStateFromDemoStage(
  stage: PathBDemoStage,
  overrides?: Partial<PathBVideoState>,
): PathBVideoState {
  const owner = overrides?.owner ?? ownerForDemoStage(stage)
  const editorPhase =
    overrides?.editorPhase ??
    (owner === 'editor' && stage !== 'editor_fix' ? ('videos' as const) : undefined)

  let releasedToClientFinalVideoReview = overrides?.releasedToClientFinalVideoReview
  if (releasedToClientFinalVideoReview === undefined) {
    releasedToClientFinalVideoReview = stage === 'client_qa'
  }

  return {
    owner,
    stageLabel: overrides?.stageLabel ?? getPathBDemoStageLabel(stage),
    deadlineRole: overrides?.deadlineRole ?? deadlineRoleForOwner(owner),
    demoStage: stage,
    editorPhase,
    releasedToClientFinalVideoReview,
    ...overrides,
  }
}

export function batchDemoStageAfterIntake(
  path: BatchIntakePath,
): PathBDemoStage {
  return path === 'clips_ready' ? 'clips_ready_intake' : 'clips_identifying'
}

export function batchClipReviewPhaseAfterIntake(
  path: BatchIntakePath,
): BatchClipReviewPhase {
  return path === 'clips_ready' ? 'approved' : 'smm_identifying'
}

export function batchDemoStageAfterSmmClipsFolder(): PathBDemoStage {
  return 'clip_client_review'
}

export function batchDemoStageAfterClipApproval(): PathBDemoStage {
  return 'pre_split_production'
}

export function batchDemoStageAfterDeliverablesSplit(): PathBDemoStage {
  return 'production'
}

export function batchDemoStageAfterScheduleComplete(): PathBDemoStage {
  return 'completed'
}

export function patchBatchDemoStage(
  batch: AdminBatchFolder,
  demoStage: PathBDemoStage,
  extra?: Partial<AdminBatchFolder>,
): AdminBatchFolder {
  return { ...batch, demoStage, ...extra }
}

export function createClipReviewGateTicket(
  batch: AdminBatchFolder,
  id: string,
): AdminVideoTicket {
  return {
    id,
    batchId: batch.id,
    clientId: batch.clientId,
    title: 'Clip approval',
    deadlineAt: null,
    ...videoStateFromDemoStage('clip_client_review'),
  }
}

export function createPreSplitGateTicket(
  batch: AdminBatchFolder,
  id: string,
  stage: 'pre_split_production' | 'clips_ready_intake' = 'pre_split_production',
): AdminVideoTicket {
  return {
    id,
    batchId: batch.id,
    clientId: batch.clientId,
    title: `Batch — ${batch.title}`,
    deadlineAt: null,
    ...videoStateFromDemoStage(stage),
  }
}

export function createSplitDeliverableTicket(
  batch: AdminBatchFolder,
  index: number,
  id: string,
  title: string,
): AdminVideoTicket {
  return {
    id,
    batchId: batch.id,
    clientId: batch.clientId,
    deliverableIndex: index,
    title,
    deadlineAt: null,
    assetVersions: { video: 1, thumbnail: 1 },
    ...videoStateFromDemoStage('production'),
  }
}
