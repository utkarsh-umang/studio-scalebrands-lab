import type { EmployeeKind, UserRole } from '@mockData/index'

/** Signed-in user shape — no password (mirrors GET /auth/me). */
export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
  employeeKind?: EmployeeKind
  /** Set when role is client (UUID from API). */
  clientProfileId?: string
}
