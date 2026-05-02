import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_USERS } from '@mockData/index'
import {
  clearStoredUser,
  readStoredUser,
  writeStoredUser,
} from './mockAuthStorage'
import {
  MockAuthContext,
  type MockAuthContextValue,
} from './mockAuthContext'
import type { AuthUser } from './types'

function recordToAuthUser(record: (typeof MOCK_USERS)[number]): AuthUser {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    ...(record.employeeKind !== undefined
      ? { employeeKind: record.employeeKind }
      : {}),
  }
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const login = useCallback<
    MockAuthContextValue['login']
  >(async (email, password) => {
    const normalized = email.trim().toLowerCase()
    const match = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === normalized,
    )
    if (!match || match.password !== password) {
      return {
        ok: false,
        message: 'Invalid email or password. Please try again.',
      }
    }
    const next = recordToAuthUser(match)
    writeStoredUser(next)
    setUser(next)
    return { ok: true, user: next }
  }, [])

  const logout = useCallback(() => {
    clearStoredUser()
    setUser(null)
  }, [])

  const value = useMemo<MockAuthContextValue>(
    () => ({ user, login, logout }),
    [user, login, logout],
  )

  return (
    <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
  )
}
