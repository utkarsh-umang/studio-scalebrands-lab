import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  EditorService,
  type DeliverableTitleInput,
  type SubmitDeliverablesDriveRequest,
} from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

export function useSubmitDeliverablesDriveMutation(batchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmitDeliverablesDriveRequest) =>
      EditorService.submitDeliverablesDriveApiV1EditorBatchesBatchIdDeliverablesDrivePost(
        batchId,
        body,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
    },
  })
}

export type DeliverablesSubmitPayload = {
  deliverableCount: number
  deliverables?: DeliverableTitleInput[]
}
