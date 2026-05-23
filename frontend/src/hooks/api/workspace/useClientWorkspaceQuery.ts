import { useQuery } from '@tanstack/react-query'
import { WorkspaceService } from '@/client'
import {
  mapBatchFolder,
  mapClientProfile,
  mapVideoTicket,
} from '@/lib/adminApiMappers'
import { readAccessToken } from '@/auth/authTokenStorage'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

export function useClientWorkspaceQuery(enabled = true) {
  const hasToken = !!readAccessToken()
  return useQuery({
    queryKey: workspaceQueryKeys.client(),
    queryFn: async () => {
      const res = await WorkspaceService.clientWorkspaceApiV1ClientWorkspaceGet()
      return {
        client: mapClientProfile(res.client),
        batches: res.batches.map(mapBatchFolder),
        videos: res.videos.map(mapVideoTicket),
      }
    },
    enabled: enabled && hasToken,
  })
}
