import { Navigate } from 'react-router-dom'
import { homePathForUser, useAuth } from '@/auth'

/** Sends authenticated users to their portal; others to login. */
export function RootRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={homePathForUser(user)} replace />
}
