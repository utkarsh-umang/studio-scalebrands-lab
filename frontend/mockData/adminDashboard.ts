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
  withClient: 7,
  withSmm: 12,
  withEditor: 5,
}

export const MOCK_ADMIN_PIPELINE_ITEMS: AdminPipelineItem[] = [
  {
    id: 'b-204',
    batchTitle: 'Q2 product clips',
    clientLabel: 'TechWithTim',
    owner: 'client',
    stageLabel: 'Clip approval',
    updatedAt: '2026-04-28',
  },
  {
    id: 'b-201',
    batchTitle: 'Spring launch teasers',
    clientLabel: 'Northwind Media',
    owner: 'editor',
    stageLabel: 'Video editing',
    updatedAt: '2026-04-29',
  },
  {
    id: 'b-198',
    batchTitle: 'Founder story — batch 2',
    clientLabel: 'TechWithTim',
    owner: 'client',
    stageLabel: 'Final video review',
    updatedAt: '2026-04-30',
  },
  {
    id: 'b-192',
    batchTitle: 'Weekly Shorts — May',
    clientLabel: 'Brightline Co.',
    owner: 'smm',
    stageLabel: 'Thumbnail + title creation',
    updatedAt: '2026-04-30',
  },
  {
    id: 'b-189',
    batchTitle: 'Customer proof — series A',
    clientLabel: 'Northwind Media',
    owner: 'smm',
    stageLabel: 'SMM QA',
    updatedAt: '2026-04-27',
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
    batchId: 'b-201',
    batchTitle: 'Spring launch teasers',
    clientLabel: 'Northwind Media',
    assigneeRole: 'editor',
    assigneeName: 'Arnav',
    taskLabel: 'Edit + thumbnail',
    dueAt: '2026-05-03T17:00:00.000Z',
    updatedAt: '2026-04-29',
  },
  {
    id: 't-502',
    batchId: 'b-192',
    batchTitle: 'Weekly Shorts — May',
    clientLabel: 'Brightline Co.',
    assigneeRole: 'smm',
    assigneeName: 'Priya',
    taskLabel: 'Text creation',
    dueAt: '2026-05-01T15:00:00.000Z',
    updatedAt: '2026-04-30',
  },
  {
    id: 't-503',
    batchId: 'b-189',
    batchTitle: 'Customer proof — series A',
    clientLabel: 'Northwind Media',
    assigneeRole: 'smm',
    assigneeName: 'Priya',
    taskLabel: 'Video QA',
    dueAt: null,
    updatedAt: '2026-04-27',
  },
  {
    id: 't-504',
    batchId: 'b-175',
    batchTitle: 'Launch day cutdowns',
    clientLabel: 'TechWithTim',
    assigneeRole: 'editor',
    assigneeName: 'Arnav',
    taskLabel: 'Resolve QA flags',
    dueAt: '2026-05-06T23:59:00.000Z',
    updatedAt: '2026-04-26',
  },
]
