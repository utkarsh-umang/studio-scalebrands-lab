import type { AuthUser } from './types'

/** Default landing route after login for each role (prototype). */
export function homePathForUser(user: AuthUser): string {
  if (user.role === 'client') return '/client/overview'
  if (user.role === 'admin') return '/admin/overview'
  if (user.role === 'employee') {
    return user.employeeKind === 'editor' ? '/editor' : '/smm'
  }
  return '/login'
}
