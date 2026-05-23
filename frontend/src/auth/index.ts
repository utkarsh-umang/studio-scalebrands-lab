export { AuthProvider } from './AuthProvider'
export { AuthContext } from './authContext'
export type { AuthContextValue } from './authContext'
export { useAuth, useMockAuth } from './useAuth'
export type { AuthUser } from './types'
export { homePathForUser } from './rolePaths'
export { readAccessToken, writeAccessToken, clearAccessToken } from './authTokenStorage'
/** @deprecated B11 — prototype-only provider */
export { MockAuthProvider } from './MockAuthProvider'
