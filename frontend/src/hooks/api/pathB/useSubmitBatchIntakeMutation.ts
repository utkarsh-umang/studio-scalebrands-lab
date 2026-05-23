import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BatchIntakePath,
  ClientService,
  type SubmitBatchIntakeRequest,
} from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

export function useSubmitBatchIntakeMutation(batchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmitBatchIntakeRequest) =>
      ClientService.submitBatchIntakeApiV1ClientBatchesBatchIdIntakePost(
        batchId,
        body,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
    },
  })
}

export function toIntakePath(path: 'source_media' | 'clips_ready'): BatchIntakePath {
  return path === 'clips_ready'
    ? BatchIntakePath.CLIPS_READY
    : BatchIntakePath.SOURCE_MEDIA
}
