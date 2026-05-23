import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { OpenAPI } from '@/client'
import { useLoginMutation } from '@/hooks/api/auth/useLoginMutation'
import { useMeQuery } from '@/hooks/api/auth/useMeQuery'
import { AuthContext, type AuthContextValue } from './authContext'
import {
  clearAccessToken,
  readAccessToken,
  writeAccessToken,
} from './authTokenStorage'
import { mapMeToAuthUser } from './mapMeToAuthUser'
import type { AuthUser } from './types'

function syncOpenApiToken() {
  const token = readAccessToken()
  OpenAPI.TOKEN = token ?? undefined
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [bootstrapped, setBootstrapped] = useState(false)
  const loginMutation = useLoginMutation()
  const meQuery = useMeQuery(bootstrapped)

  useEffect(() => {
    syncOpenApiToken()
    setBootstrapped(true)
  }, [])

  useEffect(() => {
    if (bootstrapped && readAccessToken() && meQuery.isError) {
      clearAccessToken()
      syncOpenApiToken()
      void queryClient.removeQueries({ queryKey: ['me'] })
    }
  }, [bootstrapped, meQuery.isError, queryClient])

  const user: AuthUser | null = useMemo(() => {
    if (meQuery.data) return mapMeToAuthUser(meQuery.data)
    return null
  }, [meQuery.data])

  const isLoading =
    bootstrapped && !!readAccessToken() && meQuery.isLoading && !meQuery.data

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      try {
        const result = await loginMutation.mutateAsync({ email, password })
        writeAccessToken(result.accessToken)
        syncOpenApiToken()
        queryClient.setQueryData(['me'], result.user)
        const next = mapMeToAuthUser(result.user)
        return { ok: true, user: next }
      } catch {
        return {
          ok: false,
          message: 'Invalid email or password. Please try again.',
        }
      }
    },
    [loginMutation, queryClient],
  )

  const logout = useCallback(() => {
    clearAccessToken()
    syncOpenApiToken()
    void queryClient.removeQueries({ queryKey: ['me'] })
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
