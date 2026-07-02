import { useQuery } from '@tanstack/react-query'
import { ActivityService } from '@/client'

/** Per-batch audit trail (approvals, rejections, QA, scheduling). */
export function useBatchActivityQuery(batchId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['batch-activity', batchId] as const,
    queryFn: () =>
      ActivityService.getBatchActivityApiV1BatchesBatchIdActivityGet(batchId as string),
    enabled: enabled && !!batchId,
  })
}
