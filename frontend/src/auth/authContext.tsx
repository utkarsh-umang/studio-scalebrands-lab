import { createContext } from 'react'
import type { AuthUser } from './types'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<
    { ok: true; user: AuthUser } | { ok: false; message: string }
  >
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
