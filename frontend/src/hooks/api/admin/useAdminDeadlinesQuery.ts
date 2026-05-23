import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/client'
import { mapDeadlineTask } from '@/lib/adminApiMappers'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'

export function useAdminDeadlinesQuery() {
  return useQuery({
    queryKey: adminQueryKeys.deadlines(),
    queryFn: async () => {
      const res = await AdminService.getDeadlinesApiV1AdminDeadlinesGet()
      return res.tasks.map(mapDeadlineTask)
    },
  })
}
