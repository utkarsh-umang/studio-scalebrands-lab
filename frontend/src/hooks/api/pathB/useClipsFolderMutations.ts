import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BatchesService,
  ClientService,
  type ApproveBatchClipsRequest,
  type RejectBatchClipsRequest,
  type SubmitClipsFolderRequest,
} from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

function useInvalidateAllWorkspaces() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
  }
}

export function useSubmitClipsFolderMutation(batchId: string) {
  const invalidate = useInvalidateAllWorkspaces()
  return useMutation({
    mutationFn: (body: SubmitClipsFolderRequest) =>
      BatchesService.submitClipsFolderApiV1BatchesBatchIdClipsFolderPost(
        batchId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useApproveBatchClipsMutation(batchId: string) {
  const invalidate = useInvalidateAllWorkspaces()
  return useMutation({
    mutationFn: (body: ApproveBatchClipsRequest) =>
      ClientService.approveBatchClipsApiV1ClientBatchesBatchIdClipsApprovePost(
        batchId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useRejectBatchClipsMutation(batchId: string) {
  const invalidate = useInvalidateAllWorkspaces()
  return useMutation({
    mutationFn: (body: RejectBatchClipsRequest) =>
      ClientService.rejectBatchClipsApiV1ClientBatchesBatchIdClipsRejectPost(
        batchId,
        body,
      ),
    onSuccess: invalidate,
  })
}
