import type { AuthUser } from './types'

const STORAGE_KEY = 'sbl_mock_auth_user'

export function readStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (
      typeof parsed?.id === 'string' &&
      typeof parsed?.email === 'string' &&
      typeof parsed?.name === 'string' &&
      typeof parsed?.role === 'string'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function writeStoredUser(user: AuthUser): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
