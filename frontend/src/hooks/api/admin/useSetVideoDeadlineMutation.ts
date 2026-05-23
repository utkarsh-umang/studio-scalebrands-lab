import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminService, type SetVideoDeadlineRequest } from '@/client'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

export function useSetVideoDeadlineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      videoTicketId,
      body,
    }: {
      videoTicketId: string
      body: SetVideoDeadlineRequest
    }) =>
      AdminService.setVideoDeadlineApiV1AdminVideosVideoTicketIdDeadlinePatch(
        videoTicketId,
        body,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
    },
  })
}
