import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClientService } from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

/**
 * Write paths for client-supplied assets. Thumbnail ownership is enforced by
 * the backend; titles are also editable during the client's final QA pass.
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
