import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IdeasService } from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

function useInvalidateWorkspace() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
  }
}

/** Path A (idea-first) mutations. All return the batch's videos response. */
export function useIdeasMutations(batchId: string) {
  const invalidate = useInvalidateWorkspace()
  const requestIdeas = useMutation({
    mutationFn: () => IdeasService.requestIdeasApiV1ClientBatchesBatchIdRequestIdeasPost(batchId),
    onSuccess: invalidate,
  })
  const submitIdeas = useMutation({
    mutationFn: (ideas: string[]) => IdeasService.submitIdeasApiV1BatchesBatchIdIdeasPost(batchId, { ideas }),
    onSuccess: invalidate,
  })
  const approveIdeas = useMutation({
    mutationFn: () => IdeasService.approveIdeasApiV1ClientBatchesBatchIdIdeasApprovePost(batchId),
    onSuccess: invalidate,
  })
  const rejectIdeas = useMutation({
    mutationFn: (note: string | null) => IdeasService.rejectIdeasApiV1ClientBatchesBatchIdIdeasRejectPost(batchId, { note }),
    onSuccess: invalidate,
  })
  const submitFootage = useMutation({
    mutationFn: (url: string) => IdeasService.submitIdeaFootageApiV1ClientBatchesBatchIdIdeaFootagePost(batchId, { url }),
    onSuccess: invalidate,
  })
  return { requestIdeas, submitIdeas, approveIdeas, rejectIdeas, submitFootage }
}
