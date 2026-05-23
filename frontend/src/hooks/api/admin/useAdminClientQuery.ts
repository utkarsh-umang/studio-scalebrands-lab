import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/client'
import { mapClientProfile } from '@/lib/adminApiMappers'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'

export function useAdminClientQuery(clientId: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.client(clientId ?? ''),
    queryFn: async () => {
      const res = await AdminService.getClientApiV1AdminClientsClientIdGet(clientId!)
      return {
        client: mapClientProfile(res),
        reservedCredits: res.reservedCredits,
        creditsDebitedTotal: res.creditsDebitedTotal,
        activeBatchNumber: res.activeBatchNumber ?? null,
      }
    },
    enabled: Boolean(clientId),
  })
}
