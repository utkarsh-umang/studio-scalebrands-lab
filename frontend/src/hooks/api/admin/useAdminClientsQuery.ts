import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/client'
import { mapClientListItem } from '@/lib/adminApiMappers'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'
import type { AdminClientProfile } from '@/types/pathB'

export type AdminClientTableRow = {
  client: AdminClientProfile
  activeBatchNumber: number | null
  reservedCredits: number
}

export function useAdminClientsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.clients(),
    queryFn: async (): Promise<AdminClientTableRow[]> => {
      const res = await AdminService.listClientsApiV1AdminClientsGet()
      return res.clients.map((row) => ({
        client: mapClientListItem(row),
        activeBatchNumber: row.activeBatchNumber ?? null,
        reservedCredits: row.reservedCredits,
      }))
    },
  })
}
