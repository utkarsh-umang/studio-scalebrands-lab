import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [bootstrapped, setBootstrapped] = useState(false)
  const [hasToken, setHasToken] = useState(() => !!readAccessToken())
  const loginMutation = useLoginMutation()
  const meQuery = useMeQuery(bootstrapped && hasToken)

  useEffect(() => {
    syncOpenApiToken()
    setHasToken(!!readAccessToken())
    setBootstrapped(true)
  }, [])

  useEffect(() => {
    if (bootstrapped && hasToken && meQuery.isError) {
      clearAccessToken()
      syncOpenApiToken()
      setHasToken(false)
      void queryClient.removeQueries({ queryKey: ['me'] })
      navigate('/login', { replace: true })
    }
  }, [bootstrapped, hasToken, meQuery.isError, queryClient, navigate])

  const user: AuthUser | null = useMemo(() => {
    if (!hasToken) return null
    if (meQuery.data) return mapMeToAuthUser(meQuery.data)
    return null
  }, [hasToken, meQuery.data])

  const isLoading =
    bootstrapped && hasToken && meQuery.isLoading && !meQuery.data

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      try {
        const result = await loginMutation.mutateAsync({ email, password })
        writeAccessToken(result.accessToken)
        syncOpenApiToken()
        setHasToken(true)
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
    setHasToken(false)
    void queryClient.removeQueries({ queryKey: ['me'] })
    void queryClient.removeQueries({ queryKey: ['workspace'] })
    navigate('/login', { replace: true })
  }, [queryClient, navigate])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
