import { useContext } from 'react'
import { MockAuthContext } from './mockAuthContext'

export function useMockAuth() {
  const ctx = useContext(MockAuthContext)
  if (!ctx) {
    throw new Error('useMockAuth must be used within MockAuthProvider')
  }
  return ctx
}
