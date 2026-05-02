import type { EmployeeKind, UserRole } from '@mockData/index'

/** Signed-in user shape — no password (mirrors future API session payload). */
export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
  employeeKind?: EmployeeKind
}
