import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/client'
import { mapPipelineItem, mapPipelineSummary } from '@/lib/adminApiMappers'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'

export function useAdminPipelineQuery() {
  return useQuery({
    queryKey: adminQueryKeys.pipeline(),
    queryFn: async () => {
      const res = await AdminService.getPipelineApiV1AdminPipelineGet()
      return {
        summary: mapPipelineSummary(res.summary),
        items: res.items.map(mapPipelineItem),
      }
    },
  })
}
