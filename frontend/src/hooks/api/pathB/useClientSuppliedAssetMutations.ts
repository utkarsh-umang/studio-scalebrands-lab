import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClientService } from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

/**
 * Write paths for clients who supply their own assets. Both are rejected by the
 * backend unless the admin marked that step client-owned on the batch, so the
 * caller should only render these when the ownership says so.
 */
export function useClientThumbnailsFolderMutation(batchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (url: string) =>
      ClientService.submitClientThumbnailsFolderApiV1ClientBatchesBatchIdThumbnailsFolderPost(
        batchId,
        { url },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
    },
  })
}

export function useClientTitleMutation(videoTicketId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) =>
      ClientService.setClientTitleApiV1ClientVideosVideoTicketIdTitlePost(
        videoTicketId,
        { title },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
    },
  })
}
