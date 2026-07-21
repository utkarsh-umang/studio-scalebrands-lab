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

/**
 * One row in the admin pipeline list. Rows arrive grouped: a `batch` header
 * followed by its `video` rows. A batch that has not been split into per-clip
 * cards yet emits only a header, and keeps the owner chip.
 */
export type AdminPipelineItem = {
  id: string
  kind: 'batch' | 'video'
  batchId: string
  clientId: string
  batchTitle: string
  clientLabel: string
  /** Null on split headers (videos own the chips) and on delivered videos. */
  owner: PipelineOwnerKind | null
  stageLabel: string
  /** ISO date */
  updatedAt: string
  deliverableIndex?: number | null
  openVideoCount?: number | null
  totalVideoCount?: number | null
  /** e.g. "YouTube Shorts · 24 Jul 2026" — set once a video is scheduled. */
  scheduleLabel?: string | null
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
