import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { homePathForUser, useMockAuth } from '@/auth'
import type { AuthUser } from '@/auth'

export type ProtectedPortal = 'client' | 'admin' | 'editor' | 'smm'

function canAccess(user: AuthUser, portal: ProtectedPortal): boolean {
  if (portal === 'client') return user.role === 'client'
  if (portal === 'admin') return user.role === 'admin'
  if (portal === 'editor')
    return user.role === 'employee' && user.employeeKind === 'editor'
  if (portal === 'smm')
    return user.role === 'employee' && user.employeeKind === 'smm'
  return false
}

type ProtectedRouteProps = {
  portal: ProtectedPortal
  children: ReactNode
}

export function ProtectedRoute({ portal, children }: ProtectedRouteProps) {
  const { user } = useMockAuth()
  const location = useLocation()

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (!canAccess(user, portal)) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  return children
}
