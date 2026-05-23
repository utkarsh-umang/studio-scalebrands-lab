import { useQuery } from '@tanstack/react-query'
import { WorkspaceService } from '@/client'
import {
  mapBatchFolder,
  mapClientProfile,
  mapVideoTicket,
} from '@/lib/adminApiMappers'
import { readAccessToken } from '@/auth/authTokenStorage'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

export function useEditorWorkspaceQuery(enabled = true) {
  const hasToken = !!readAccessToken()
  return useQuery({
    queryKey: workspaceQueryKeys.editor(),
    queryFn: async () => {
      const res = await WorkspaceService.editorWorkspaceApiV1EditorWorkspaceGet()
      return {
        clients: res.clients.map(mapClientProfile),
        batches: res.batches.map(mapBatchFolder),
        videos: res.videos.map(mapVideoTicket),
      }
    },
    enabled: enabled && hasToken,
  })
}
