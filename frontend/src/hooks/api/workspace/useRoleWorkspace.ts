import { useCallback, useMemo } from 'react'
import { useAuth } from '@/auth'
import type {
  AdminBatchFolder,
  AdminClientProfile,
  AdminVideoTicket,
} from '@/types/pathB'
import { useAdminWorkspaceQuery } from './useAdminWorkspaceQuery'
import { useClientWorkspaceQuery } from './useClientWorkspaceQuery'
import { useEditorWorkspaceQuery } from './useEditorWorkspaceQuery'
import { useSmmWorkspaceQuery } from './useSmmWorkspaceQuery'

export function useRoleWorkspace() {
  const { user } = useAuth()

  const clientWorkspace = useClientWorkspaceQuery(user?.role === 'client')
  const editorWorkspace = useEditorWorkspaceQuery(
    user?.role === 'employee' && user.employeeKind === 'editor',
  )
  const smmWorkspace = useSmmWorkspaceQuery(
    user?.role === 'employee' && user.employeeKind === 'smm',
  )
  const adminWorkspace = useAdminWorkspaceQuery(user?.role === 'admin')

  const clients = useMemo((): AdminClientProfile[] => {
    if (user?.role === 'client' && clientWorkspace.data) {
      return [clientWorkspace.data.client]
    }
    if (
      user?.role === 'employee' &&
      user.employeeKind === 'editor' &&
      editorWorkspace.data
    ) {
      return editorWorkspace.data.clients
    }
    if (
      user?.role === 'employee' &&
      user.employeeKind === 'smm' &&
      smmWorkspace.data
    ) {
      return smmWorkspace.data.clients
    }
    if (user?.role === 'admin' && adminWorkspace.data) {
      return adminWorkspace.data.clients
    }
    return []
  }, [user, clientWorkspace.data, editorWorkspace.data, smmWorkspace.data, adminWorkspace.data])

  const batches = useMemo((): AdminBatchFolder[] => {
    if (user?.role === 'client' && clientWorkspace.data) {
      return clientWorkspace.data.batches
    }
    if (
      user?.role === 'employee' &&
      user.employeeKind === 'editor' &&
      editorWorkspace.data
    ) {
      return editorWorkspace.data.batches
    }
    if (
      user?.role === 'employee' &&
      user.employeeKind === 'smm' &&
      smmWorkspace.data
    ) {
      return smmWorkspace.data.batches
    }
    if (user?.role === 'admin' && adminWorkspace.data) {
      return adminWorkspace.data.batches
    }
    return []
  }, [user, clientWorkspace.data, editorWorkspace.data, smmWorkspace.data, adminWorkspace.data])

  const videos = useMemo((): AdminVideoTicket[] => {
    if (user?.role === 'client' && clientWorkspace.data) {
      return clientWorkspace.data.videos
    }
    if (
      user?.role === 'employee' &&
      user.employeeKind === 'editor' &&
      editorWorkspace.data
    ) {
      return editorWorkspace.data.videos
    }
    if (
      user?.role === 'employee' &&
      user.employeeKind === 'smm' &&
      smmWorkspace.data
    ) {
      return smmWorkspace.data.videos
    }
    if (user?.role === 'admin' && adminWorkspace.data) {
      return adminWorkspace.data.videos
    }
    return []
  }, [user, clientWorkspace.data, editorWorkspace.data, smmWorkspace.data, adminWorkspace.data])

  const isWorkspaceLoading =
    (user?.role === 'client' && clientWorkspace.isLoading) ||
    (user?.role === 'employee' &&
      user.employeeKind === 'editor' &&
      editorWorkspace.isLoading) ||
    (user?.role === 'employee' && user.employeeKind === 'smm' && smmWorkspace.isLoading) ||
    (user?.role === 'admin' && adminWorkspace.isLoading)

  const isWorkspaceError =
    (user?.role === 'client' && clientWorkspace.isError) ||
    (user?.role === 'employee' &&
      user.employeeKind === 'editor' &&
      editorWorkspace.isError) ||
    (user?.role === 'employee' && user.employeeKind === 'smm' && smmWorkspace.isError) ||
    (user?.role === 'admin' && adminWorkspace.isError)

  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients],
  )

  const getBatchesForClient = useCallback(
    (clientId: string) =>
      batches
        .filter((b) => b.clientId === clientId)
        .sort((a, b) => b.batchNumber - a.batchNumber),
    [batches],
  )

  const getActiveBatchNumber = useCallback(
    (clientId: string) => {
      const client = clients.find((c) => c.id === clientId)
      if (!client || client.accountStatus !== 'active') return null
      const active = batches.filter(
        (b) => b.clientId === clientId && b.status === 'active',
      )
      if (active.length === 0) return null
      return Math.max(...active.map((b) => b.batchNumber))
    },
    [batches, clients],
  )

  const getVideosForBatch = useCallback(
    (batchId: string) => videos.filter((v) => v.batchId === batchId),
    [videos],
  )

  return {
    clients,
    batches,
    videos,
    isWorkspaceLoading,
    isWorkspaceError,
    getClient,
    getBatchesForClient,
    getActiveBatchNumber,
    getVideosForBatch,
  }
}
