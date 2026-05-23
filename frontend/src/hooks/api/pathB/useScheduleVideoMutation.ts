import { useMutation, useQueryClient } from '@tanstack/react-query'
import { VideosService, type ScheduleVideoRequest } from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

export function useScheduleVideoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      videoTicketId,
      body,
    }: {
      videoTicketId: string
      body: ScheduleVideoRequest
    }) =>
      VideosService.scheduleVideoApiV1VideosVideoTicketIdSchedulePost(
        videoTicketId,
        body,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
    },
  })
}
