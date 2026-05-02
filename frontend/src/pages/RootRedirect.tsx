import { Navigate } from 'react-router-dom'
import { homePathForUser, useMockAuth } from '@/auth'

/** Sends authenticated users to their portal; others to login. */
export function RootRedirect() {
  const { user } = useMockAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={homePathForUser(user)} replace />
}
