/**
 * Frontend-only login prototype data.
 * Passwords are plaintext here by design — replace with API auth later.
 */
export type UserRole = 'client' | 'admin' | 'employee'

export type EmployeeKind = 'editor' | 'smm'

export type MockUserRecord = {
  id: string
  email: string
  /** Demo only; never ship real secrets this way */
  password: string
  name: string
  role: UserRole
  /** When role is `employee`, distinguishes Editor vs SMM */
  employeeKind?: EmployeeKind
  /** Links client login to admin workspace client profile */
  clientProfileId?: string
}

export const MOCK_USERS: MockUserRecord[] = [
  {
    id: 'u-client-1',
    email: 'client@scalebrandslab.demo',
    password: 'demo1234',
    name: 'TechWithTim',
    role: 'client',
    clientProfileId: 'c-1',
  },
  {
    id: 'u-editor-1',
    email: 'editor@scalebrandslab.demo',
    password: 'demo1234',
    name: 'Arnav',
    role: 'employee',
    employeeKind: 'editor',
  },
  {
    id: 'u-smm-1',
    email: 'smm@scalebrandslab.demo',
    password: 'demo1234',
    name: 'Priya',
    role: 'employee',
    employeeKind: 'smm',
  },
  {
    id: 'u-admin-1',
    email: 'admin@scalebrandslab.demo',
    password: 'demo1234',
    name: 'Scale Brands Lab',
    role: 'admin',
  },
]
