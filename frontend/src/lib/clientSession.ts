import type { AuthUser } from '@/auth'
import { MOCK_ADMIN_CLIENT_PROFILES } from '@mockData/index'

/** Resolve workspace client profile id from the logged-in client user. */
export function resolveClientProfileId(user: AuthUser | null): string | null {
  if (!user || user.role !== 'client') return null
  if (user.clientProfileId) return user.clientProfileId
  const byEmail = MOCK_ADMIN_CLIENT_PROFILES.find(
    (p) => p.loginId.toLowerCase() === user.email.toLowerCase(),
  )
  return byEmail?.id ?? null
}
