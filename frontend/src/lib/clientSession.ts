import type { AuthUser } from '@/auth'

/** Resolve workspace client profile id from the logged-in client user. */
export function resolveClientProfileId(user: AuthUser | null): string | null {
  if (!user || user.role !== 'client') return null
  return user.clientProfileId ?? null
}
