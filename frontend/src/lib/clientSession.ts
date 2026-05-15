import type { AuthUser } from '@/auth'
import { MOCK_ADMIN_CLIENT_PROFILES, MOCK_USERS } from '@mockData/index'

/** Resolve workspace client profile id from the logged-in client user. */
export function resolveClientProfileId(user: AuthUser | null): string | null {
  if (!user || user.role !== 'client') return null
  const record = MOCK_USERS.find((u) => u.id === user.id)
  if (record?.clientProfileId) return record.clientProfileId
  const byEmail = MOCK_ADMIN_CLIENT_PROFILES.find(
    (p) => p.loginId.toLowerCase() === user.email.toLowerCase(),
  )
  return byEmail?.id ?? null
}
