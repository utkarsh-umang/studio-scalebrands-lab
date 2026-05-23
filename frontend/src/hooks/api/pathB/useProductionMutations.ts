import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  VideosService,
  type DeliverableDriveSyncRequest,
  type UpdateProductionRequest,
} from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

function useInvalidateWorkspaces() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
  }
}

export function useUpdateProductionMutation(videoTicketId: string) {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: (body: UpdateProductionRequest) =>
      VideosService.updateProductionApiV1VideosVideoTicketIdProductionPatch(
        videoTicketId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useDeliverableDriveSyncMutation(videoTicketId: string) {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: (body: DeliverableDriveSyncRequest) =>
      VideosService.recordDriveSyncApiV1VideosVideoTicketIdDriveSyncPost(
        videoTicketId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useSubmitToSmmQaMutation(videoTicketId: string) {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: () =>
      VideosService.submitToSmmQaApiV1VideosVideoTicketIdSubmitToSmmQaPost(
        videoTicketId,
      ),
    onSuccess: invalidate,
  })
}
