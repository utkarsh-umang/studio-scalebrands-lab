import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/client'
import { adminQueryKeys } from '@/hooks/api/admin/adminQueryKeys'

/** Read-only credit ledger (top-ups + batch debits) for a client. */
export function useCreditHistoryQuery(clientId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'credit-history', clientId] as const,
    queryFn: () =>
      AdminService.getCreditHistoryApiV1AdminClientsClientIdCreditHistoryGet(
        clientId as string,
      ),
    enabled: enabled && !!clientId,
  })
}
