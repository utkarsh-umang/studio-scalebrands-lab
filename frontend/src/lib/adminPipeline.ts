/**
 * Admin pipeline types.
 *
 * The rollup itself lives in the backend (app/services/admin_pipeline_logic.py)
 * and arrives via GET /admin/pipeline. This file used to carry a parallel
 * TypeScript implementation from the mock-data era; it went unused once the
 * endpoint landed, and kept a batch-level rollup that the backend no longer
 * agrees with, so it was removed rather than left to rot.
 */
export type {
  AdminPipelineSummary,
  AdminPipelineItem,
  PipelineOwnerKind,
} from '@/types/pathB'
