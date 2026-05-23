import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth'
import { useAdminStaffQuery } from '@/hooks/api/admin/useAdminStaffQuery'
import { useAdminWorkspaceQuery } from '@/hooks/api/workspace/useAdminWorkspaceQuery'
import { useClientWorkspaceQuery } from '@/hooks/api/workspace/useClientWorkspaceQuery'
import { useEditorWorkspaceQuery } from '@/hooks/api/workspace/useEditorWorkspaceQuery'
import { useSmmWorkspaceQuery } from '@/hooks/api/workspace/useSmmWorkspaceQuery'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'
import {
  type AdminBatchFolder,
  type AdminClientProfile,
  type AdminVideoTicket,
  type BrandGuidelinesSource,
  type StaffMember,
} from '@mockData/index'
import type { ProvisionClientInput } from '@/components/admin/ProvisionClientModal'

type CreateBatchInput = {
  clientId: string
  title: string
  footageUrl?: string
  creditCost: number
}

type UpdateTeamInput = {
  clientId: string
  smmId: string
  editorId: string
}

export type UpdateBrandGuidelinesInput = {
  clientId: string
  summary: string
  googleDocUrl?: string
}

function deriveGuidelinesSource(
  summary: string,
  googleDocUrl?: string,
): BrandGuidelinesSource {
  if (googleDocUrl?.trim()) return 'google_doc'
  if (summary.trim()) return 'internal'
  return 'internal'
}

type AdminWorkspaceContextValue = {
  clients: AdminClientProfile[]
  batches: AdminBatchFolder[]
  videos: AdminVideoTicket[]
  smmStaff: StaffMember[]
  editorStaff: StaffMember[]
  isWorkspaceLoading: boolean
  getClient: (id: string) => AdminClientProfile | undefined
  getBatchesForClient: (clientId: string) => AdminBatchFolder[]
  getActiveBatchNumber: (clientId: string) => number | null
  getVideosForBatch: (batchId: string) => AdminVideoTicket[]
  createBatchFolder: (input: CreateBatchInput) => AdminBatchFolder
  provisionClient: (input: ProvisionClientInput) => AdminClientProfile
  topUpCredits: (clientId: string, amount: number) => void
  decommissionClient: (clientId: string, reason: string) => void
  updateClientTeam: (input: UpdateTeamInput) => void
  updateBrandGuidelines: (input: UpdateBrandGuidelinesInput) => void
}

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue | null>(
  null,
)

function staffName(list: StaffMember[], id: string) {
  return list.find((s) => s.id === id)?.name ?? '—'
}

export function AdminWorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const clientWorkspace = useClientWorkspaceQuery(user?.role === 'client')
  const editorWorkspace = useEditorWorkspaceQuery(
    user?.role === 'employee' && user.employeeKind === 'editor',
  )
  const smmWorkspace = useSmmWorkspaceQuery(
    user?.role === 'employee' && user.employeeKind === 'smm',
  )
  const adminWorkspace = useAdminWorkspaceQuery(user?.role === 'admin')
  const staffQuery = useAdminStaffQuery(user?.role === 'admin')

  const [clients, setClients] = useState<AdminClientProfile[]>([])
  const [batches, setBatches] = useState<AdminBatchFolder[]>([])
  const [videos, setVideos] = useState<AdminVideoTicket[]>([])

  const invalidateWorkspace = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
  }, [queryClient])

  useEffect(() => {
    if (user?.role === 'client' && clientWorkspace.data) {
      setClients([clientWorkspace.data.client])
      setBatches(clientWorkspace.data.batches)
      setVideos(clientWorkspace.data.videos)
      return
    }
    if (user?.role === 'employee' && user.employeeKind === 'editor' && editorWorkspace.data) {
      setClients(editorWorkspace.data.clients)
      setBatches(editorWorkspace.data.batches)
      setVideos(editorWorkspace.data.videos)
      return
    }
    if (user?.role === 'employee' && user.employeeKind === 'smm' && smmWorkspace.data) {
      setClients(smmWorkspace.data.clients)
      setBatches(smmWorkspace.data.batches)
      setVideos(smmWorkspace.data.videos)
      return
    }
    if (user?.role === 'admin' && adminWorkspace.data) {
      setClients(adminWorkspace.data.clients)
      setBatches(adminWorkspace.data.batches)
      setVideos(adminWorkspace.data.videos)
    }
  }, [user, clientWorkspace.data, editorWorkspace.data, smmWorkspace.data, adminWorkspace.data])

  const isWorkspaceLoading =
    (user?.role === 'client' && clientWorkspace.isLoading) ||
    (user?.role === 'employee' &&
      user.employeeKind === 'editor' &&
      editorWorkspace.isLoading) ||
    (user?.role === 'employee' && user.employeeKind === 'smm' && smmWorkspace.isLoading) ||
    (user?.role === 'admin' && adminWorkspace.isLoading)

  const smmStaffList = staffQuery.data?.smmStaff ?? []
  const editorStaffList = staffQuery.data?.editorStaff ?? []

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

  const createBatchFolder = useCallback(
    (input: CreateBatchInput) => {
      const now = new Date().toISOString().slice(0, 10)
      const clientBatches = batches.filter((b) => b.clientId === input.clientId)
      const nextNumber =
        clientBatches.length === 0
          ? 1
          : Math.max(...clientBatches.map((b) => b.batchNumber)) + 1

      const folder: AdminBatchFolder = {
        id: `b-${Date.now()}`,
        clientId: input.clientId,
        batchNumber: nextNumber,
        title: input.title.trim(),
        status: 'active',
        videoCount: 0,
        createdAt: now,
        updatedAt: now,
        footageUrl: input.footageUrl?.trim() || undefined,
        creditCost: input.creditCost,
        creditsDebited: false,
      }
      setBatches((prev) => [folder, ...prev])
      return folder
    },
    [batches],
  )

  const provisionClient = useCallback((input: ProvisionClientInput) => {
    const now = new Date().toISOString().slice(0, 10)
    const defaultSmm = smmStaffList[0]
    const defaultEditor = editorStaffList[0]
    const client: AdminClientProfile = {
      id: `c-${Date.now()}`,
      loginId: input.loginId,
      password: input.password,
      displayName: input.displayName,
      credits: input.initialCredits,
      accountStatus: 'active',
      createdAt: now,
      assignedSmmId: defaultSmm?.id ?? '',
      assignedSmmName: defaultSmm?.name ?? '—',
      assignedEditorId: defaultEditor?.id ?? '',
      assignedEditorName: defaultEditor?.name ?? '—',
      brandGuidelines: {
        source: 'internal',
        summary: '',
        lastUpdatedAt: now,
      },
    }
    setClients((prev) => [client, ...prev])
    return client
  }, [editorStaffList, smmStaffList])

  const topUpCredits = useCallback((clientId: string, amount: number) => {
    if (amount <= 0) return
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, credits: c.credits + amount } : c,
      ),
    )
  }, [])

  const decommissionClient = useCallback((clientId: string, reason: string) => {
    const now = new Date().toISOString().slice(0, 10)
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              accountStatus: 'decommissioned',
              decommissionReason: reason.trim(),
              decommissionedAt: now,
            }
          : c,
      ),
    )
  }, [])

  const updateClientTeam = useCallback((input: UpdateTeamInput) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== input.clientId) return c
        return {
          ...c,
          assignedSmmId: input.smmId,
          assignedSmmName: staffName(smmStaffList, input.smmId),
          assignedEditorId: input.editorId,
          assignedEditorName: staffName(editorStaffList, input.editorId),
        }
      }),
    )
    invalidateWorkspace()
  }, [editorStaffList, invalidateWorkspace, smmStaffList])

  const updateBrandGuidelines = useCallback(
    (input: UpdateBrandGuidelinesInput) => {
      const summary = input.summary.trim()
      const googleDocUrl = input.googleDocUrl?.trim() || undefined
      const now = new Date().toISOString().slice(0, 10)
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== input.clientId) return c
          return {
            ...c,
            brandGuidelines: {
              source: deriveGuidelinesSource(summary, googleDocUrl),
              summary,
              googleDocUrl,
              lastUpdatedAt: now,
            },
          }
        }),
      )
    },
    [],
  )

  const value = useMemo(
    () => ({
      clients,
      batches,
      videos,
      smmStaff: smmStaffList,
      editorStaff: editorStaffList,
      isWorkspaceLoading,
      getClient,
      getBatchesForClient,
      getActiveBatchNumber,
      getVideosForBatch,
      createBatchFolder,
      provisionClient,
      topUpCredits,
      decommissionClient,
      updateClientTeam,
      updateBrandGuidelines,
    }),
    [
      clients,
      batches,
      videos,
      getClient,
      getBatchesForClient,
      getActiveBatchNumber,
      getVideosForBatch,
      createBatchFolder,
      provisionClient,
      topUpCredits,
      decommissionClient,
      updateClientTeam,
      updateBrandGuidelines,
      isWorkspaceLoading,
      smmStaffList,
      editorStaffList,
    ],
  )

  return (
    <AdminWorkspaceContext.Provider value={value}>
      {children}
    </AdminWorkspaceContext.Provider>
  )
}

export function useAdminWorkspace() {
  const ctx = useContext(AdminWorkspaceContext)
  if (!ctx) {
    throw new Error('useAdminWorkspace must be used within AdminWorkspaceProvider')
  }
  return ctx
}
