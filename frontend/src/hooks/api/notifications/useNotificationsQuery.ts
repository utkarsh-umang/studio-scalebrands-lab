import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NotificationsService } from '@/client'
import { readAccessToken } from '@/auth/authTokenStorage'

const NOTIFICATIONS_KEY = ['notifications'] as const

/** Poll the "waiting on you" inbox so a handoff shows up without a manual refresh. */
export function useNotificationsQuery(enabled = true) {
  const hasToken = !!readAccessToken()
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => NotificationsService.getNotificationsApiV1NotificationsGet(),
    enabled: enabled && hasToken,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  })
}

export function useMarkNotificationsSeenMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      NotificationsService.markNotificationsSeenApiV1NotificationsMarkSeenPost(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    },
  })
}
