import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AdminService,
  type CreateBatchRequest,
  type DecommissionClientRequest,
  type ProvisionClientRequest,
  type ProvisionStaffRequest,
  type TopUpCreditsRequest,
  type UpdateBrandGuidelinesRequest,
  type SetBatchAssignmentsRequest,
  type UpdateClientTeamRequest,
} from '@/client'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.all })
    void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
  }
}

export function useProvisionClientMutation() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (body: ProvisionClientRequest) =>
      AdminService.provisionClientApiV1AdminClientsPost(body),
    onSuccess: invalidate,
  })
}

export function useTopUpCreditsMutation(clientId: string) {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (body: TopUpCreditsRequest) =>
      AdminService.topUpCreditsApiV1AdminClientsClientIdCreditsTopUpPost(
        clientId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useDecommissionClientMutation(clientId: string) {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (body: DecommissionClientRequest) =>
      AdminService.decommissionClientApiV1AdminClientsClientIdDecommissionPost(
        clientId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useUpdateClientTeamMutation(clientId: string) {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (body: UpdateClientTeamRequest) =>
      AdminService.updateClientTeamApiV1AdminClientsClientIdTeamPatch(
        clientId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useSetBatchAssignmentsMutation(batchId: string) {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (body: SetBatchAssignmentsRequest) =>
      AdminService.setBatchAssignmentsApiV1AdminBatchesBatchIdAssignmentsPatch(
        batchId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useUpdateBrandGuidelinesMutation(clientId: string) {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (body: UpdateBrandGuidelinesRequest) =>
      AdminService.updateBrandGuidelinesApiV1AdminClientsClientIdBrandGuidelinesPatch(
        clientId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useCreateBatchMutation(clientId: string) {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (body: CreateBatchRequest) =>
      AdminService.createBatchApiV1AdminClientsClientIdBatchesPost(
        clientId,
        body,
      ),
    onSuccess: invalidate,
  })
}

export function useProvisionStaffMutation() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (body: ProvisionStaffRequest) =>
      AdminService.provisionStaffApiV1AdminStaffPost(body),
    onSuccess: invalidate,
  })
}
