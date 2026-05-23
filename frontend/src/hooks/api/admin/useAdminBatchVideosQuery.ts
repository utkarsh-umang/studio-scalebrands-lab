import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/client'
import { mapVideoTicket } from '@/lib/adminApiMappers'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'

export function useAdminBatchVideosQuery(
  clientId: string | undefined,
  batchId: string | undefined,
) {
  return useQuery({
    queryKey: adminQueryKeys.videos(clientId ?? '', batchId ?? ''),
    queryFn: async () => {
      const res =
        await AdminService.listBatchVideosApiV1AdminClientsClientIdBatchesBatchIdVideosGet(
          clientId!,
          batchId!,
        )
      return res.map(mapVideoTicket)
    },
    enabled: Boolean(clientId && batchId),
  })
}
