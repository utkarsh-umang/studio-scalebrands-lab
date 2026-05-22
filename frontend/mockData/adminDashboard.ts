/**
 * Admin dashboard types — pipeline and deadlines derive from workspace store.
 * See `src/lib/adminPipeline.ts`.
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
  clientId: string
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
