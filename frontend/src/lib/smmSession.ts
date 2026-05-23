import type { AuthUser } from '@/auth'

/** Resolve workspace SMM staff id from the logged-in employee user. */
export function resolveSmmStaffId(user: AuthUser | null): string | null {
  if (!user || user.role !== 'employee' || user.employeeKind !== 'smm') {
    return null
  }
  return user.id
}
