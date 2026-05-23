import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/client'
import { mapStaffList } from '@/lib/adminApiMappers'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'

export function useAdminStaffQuery(enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.staff(),
    queryFn: async () => {
      const res = await AdminService.listStaffApiV1AdminStaffGet()
      return mapStaffList(res)
    },
    enabled,
  })
}
