import { createContext } from 'react'
import type { AuthUser } from './types'

export type MockAuthContextValue = {
  user: AuthUser | null
  login: (
    email: string,
    password: string,
  ) => Promise<
    { ok: true; user: AuthUser } | { ok: false; message: string }
  >
  logout: () => void
}

export const MockAuthContext = createContext<MockAuthContextValue | null>(null)
