import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  VideosService,
  type AppendQaCommentRequest,
  type ResubmitToSmmQaRequest,
  type SubmitSmmQaRequest,
} from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

function useInvalidateWorkspaces() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
  }
}

export function useSubmitSmmQaMutation(videoTicketId: string) {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: (body: SubmitSmmQaRequest) =>
      VideosService.submitSmmQaReviewApiV1VideosVideoTicketIdSmmQaPost(
        videoTicketId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useAppendQaCommentMutation(videoTicketId: string) {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: (body: AppendQaCommentRequest) =>
      VideosService.appendQaCommentApiV1VideosVideoTicketIdQaCommentsPost(
        videoTicketId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useResubmitToSmmQaMutation(videoTicketId: string) {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: (body: ResubmitToSmmQaRequest = {}) =>
      VideosService.resubmitToSmmQaApiV1VideosVideoTicketIdResubmitToSmmQaPost(
        videoTicketId,
        body,
      ),
    onSuccess: invalidate,
  })
}
