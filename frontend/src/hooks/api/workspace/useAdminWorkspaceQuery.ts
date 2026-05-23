import { useQuery } from '@tanstack/react-query'
import { WorkspaceService } from '@/client'
import {
  mapBatchFolder,
  mapClientProfile,
  mapVideoTicket,
} from '@/lib/adminApiMappers'
import { readAccessToken } from '@/auth/authTokenStorage'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

export function useAdminWorkspaceQuery(enabled = true) {
  const hasToken = !!readAccessToken()
  return useQuery({
    queryKey: workspaceQueryKeys.admin(),
    queryFn: async () => {
      const res = await WorkspaceService.adminWorkspaceApiV1AdminWorkspaceGet()
      return {
        clients: res.clients.map(mapClientProfile),
        batches: res.batches.map(mapBatchFolder),
        videos: res.videos.map(mapVideoTicket),
      }
    },
    enabled: enabled && hasToken,
  })
}
