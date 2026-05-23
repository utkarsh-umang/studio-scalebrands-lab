import type { AuthUser } from '@/auth'

/** Resolve workspace editor staff id from the logged-in employee user. */
export function resolveEditorStaffId(user: AuthUser | null): string | null {
  if (!user || user.role !== 'employee' || user.employeeKind !== 'editor') {
    return null
  }
  return user.id
}
