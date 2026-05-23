import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/client'
import { mapBatchFolder } from '@/lib/adminApiMappers'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'

export function useAdminClientBatchesQuery(clientId: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.batches(clientId ?? ''),
    queryFn: async () => {
      const res =
        await AdminService.listClientBatchesApiV1AdminClientsClientIdBatchesGet(
          clientId!,
        )
      return res.map(mapBatchFolder)
    },
    enabled: Boolean(clientId),
  })
}
