import { useQuery } from '@tanstack/react-query'
import { AuthService } from '@/client'
import { readAccessToken } from '@/auth/authTokenStorage'

export function useMeQuery(enabled = true) {
  const hasToken = !!readAccessToken()
  return useQuery({
    queryKey: ['me'] as const,
    queryFn: () => AuthService.meApiV1AuthMeGet(),
    enabled: enabled && hasToken,
    retry: false,
  })
}
