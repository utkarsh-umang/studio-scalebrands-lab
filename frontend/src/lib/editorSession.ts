import type { AuthUser } from '@/auth'
import { MOCK_USERS } from '@mockData/index'

/** Resolve workspace editor staff id from the logged-in employee user. */
export function resolveEditorStaffId(user: AuthUser | null): string | null {
  if (!user || user.role !== 'employee' || user.employeeKind !== 'editor') {
    return null
  }
  const record = MOCK_USERS.find((u) => u.id === user.id)
  return record?.id ?? null
}
