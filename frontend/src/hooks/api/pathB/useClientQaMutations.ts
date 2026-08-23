import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClientQaRequest,
  ClientRevisionTriageRequest,
  ClientService,
  VideosService,
  type AppendQaCommentRequest,
} from '@/client'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

function useInvalidateWorkspaces() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
  }
}

export function clientQaRejectBody(
  feedback: VideoReviewFeedback,
): ClientQaRequest {
  const generalNote = feedback.generalNote.trim()
  const timestampFlags = feedback.markers.map((marker) => ({
    atSeconds: Math.floor(marker.at),
    note: marker.text,
  }))
  return {
    action: ClientQaRequest.action.REJECT,
    commentBody: generalNote || undefined,
    generalNote: generalNote || undefined,
    timestampFlags: timestampFlags.length > 0 ? timestampFlags : undefined,
  }
}

export function useClientQaDecisionMutation() {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: ({
      videoTicketId,
      body,
    }: {
      videoTicketId: string
      body: ClientQaRequest
    }) =>
      ClientService.submitClientQaApiV1ClientVideosVideoTicketIdClientQaPost(
        videoTicketId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useAppendClientQaCommentMutation() {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: ({
      videoTicketId,
      body,
    }: {
      videoTicketId: string
      body: AppendQaCommentRequest
    }) =>
      VideosService.appendQaCommentApiV1VideosVideoTicketIdQaCommentsPost(
        videoTicketId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useClientRevisionTriageMutation() {
  const invalidate = useInvalidateWorkspaces()
  return useMutation({
    mutationFn: ({
      videoTicketId,
      body,
    }: {
      videoTicketId: string
      body: ClientRevisionTriageRequest
    }) =>
      VideosService.triageClientRevisionApiV1VideosVideoTicketIdClientRevisionTriagePost(
        videoTicketId,
        body,
      ),
    onSuccess: invalidate,
  })
}
