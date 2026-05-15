/**
 * Prototype-only admin dashboard payload.
 * Wire to API later; keep shapes close to eventual domain models.
 */

export type PipelineOwnerKind = 'client' | 'smm' | 'editor'

/** Aggregate counts for the pipeline overview */
export type AdminPipelineSummary = {
  withClient: number
  withSmm: number
  withEditor: number
}

export type AdminPipelineItem = {
  id: string
  batchTitle: string
  clientLabel: string
  owner: PipelineOwnerKind
  stageLabel: string
  /** ISO date */
  updatedAt: string
}

export type AdminClientAccount = {
  id: string
  /** Login identifier shown to the client */
  loginId: string
  displayName: string
  credits: number
  /** ISO date */
  createdAt: string
}

export type InternalTaskAssignee = 'smm' | 'editor'

export type AdminDeadlineTask = {
  id: string
  batchId: string
  batchTitle: string
  clientLabel: string
  assigneeRole: InternalTaskAssignee
  assigneeName: string
  taskLabel: string
  /** ISO datetime or null when no deadline set */
  dueAt: string | null
  /** ISO date */
  updatedAt: string
}

export const MOCK_ADMIN_PIPELINE_SUMMARY: AdminPipelineSummary = {
  withClient: 2,
  withSmm: 3,
  withEditor: 1,
}

export const MOCK_ADMIN_PIPELINE_ITEMS: AdminPipelineItem[] = [
  {
    id: 'b-obs-final',
    batchTitle: 'Spring set — client on final video QA',
    clientLabel: 'TechWithTim',
    owner: 'client',
    stageLabel: 'Final video review',
    updatedAt: '2026-05-14',
  },
  {
    id: 'b-obs-thumb',
    batchTitle: 'Campaign B — thumbnail approval window',
    clientLabel: 'TechWithTim',
    owner: 'client',
    stageLabel: 'Thumbnail review',
    updatedAt: '2026-05-14',
  },
  {
    id: 'b-yet',
    batchTitle: 'June podcast — yet to start',
    clientLabel: 'TechWithTim',
    owner: 'smm',
    stageLabel: 'Clip identification',
    updatedAt: '2026-05-15',
  },
  {
    id: 'b-smm-qa',
    batchTitle: 'Q2 cuts — SMM video QA',
    clientLabel: 'TechWithTim',
    owner: 'smm',
    stageLabel: 'SMM QA',
    updatedAt: '2026-05-14',
  },
  {
    id: 'b-titles',
    batchTitle: 'Product drop — editor titles in Drive',
    clientLabel: 'TechWithTim',
    owner: 'smm',
    stageLabel: 'Titles prep',
    updatedAt: '2026-05-14',
  },
  {
    id: 'b-obs-edit',
    batchTitle: 'B-roll pack — with editor (clips approved)',
    clientLabel: 'TechWithTim',
    owner: 'editor',
    stageLabel: 'Videos in progress',
    updatedAt: '2026-05-14',
  },
]

export const MOCK_ADMIN_CLIENTS: AdminClientAccount[] = [
  {
    id: 'c-1',
    loginId: 'client@scalebrandslab.demo',
    displayName: 'TechWithTim',
    credits: 42,
    createdAt: '2026-01-12',
  },
  {
    id: 'c-2',
    loginId: 'northwind.media',
    displayName: 'Northwind Media',
    credits: 18,
    createdAt: '2026-02-03',
  },
  {
    id: 'c-3',
    loginId: 'brightline.studio',
    displayName: 'Brightline Co.',
    credits: 6,
    createdAt: '2026-03-20',
  },
]

export const MOCK_ADMIN_DEADLINE_TASKS: AdminDeadlineTask[] = [
  {
    id: 't-501',
    batchId: 'b-obs-edit',
    batchTitle: 'B-roll pack — with editor (clips approved)',
    clientLabel: 'TechWithTim',
    assigneeRole: 'editor',
    assigneeName: 'Arnav',
    taskLabel: 'Edit finals to Drive',
    dueAt: '2026-05-16T18:00:00.000Z',
    updatedAt: '2026-05-14',
  },
  {
    id: 't-502',
    batchId: 'b-smm-qa',
    batchTitle: 'Q2 cuts — SMM video QA',
    clientLabel: 'TechWithTim',
    assigneeRole: 'smm',
    assigneeName: 'Priya',
    taskLabel: 'SMM video QA',
    dueAt: '2026-05-14T17:00:00.000Z',
    updatedAt: '2026-05-14',
  },
]
