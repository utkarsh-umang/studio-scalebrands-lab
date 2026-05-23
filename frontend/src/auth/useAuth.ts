import { useContext } from 'react'
import { AuthContext } from './authContext'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

/** @deprecated Use useAuth — kept for incremental migration (B11 removes). */
export const useMockAuth = useAuth
