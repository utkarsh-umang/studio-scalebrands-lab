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
    mutationFn: () => IdeasService.requestIdeas(batchId),
    onSuccess: invalidate,
  })
  const submitIdeas = useMutation({
    mutationFn: (ideas: string[]) => IdeasService.submitIdeas(batchId, { ideas }),
    onSuccess: invalidate,
  })
  const approveIdeas = useMutation({
    mutationFn: () => IdeasService.approveIdeas(batchId),
    onSuccess: invalidate,
  })
  const rejectIdeas = useMutation({
    mutationFn: (note: string | null) => IdeasService.rejectIdeas(batchId, { note }),
    onSuccess: invalidate,
  })
  const submitFootage = useMutation({
    mutationFn: (url: string) => IdeasService.submitIdeaFootage(batchId, { url }),
    onSuccess: invalidate,
  })
  return { requestIdeas, submitIdeas, approveIdeas, rejectIdeas, submitFootage }
}
