import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  MOCK_ADMIN_BATCH_FOLDERS,
  MOCK_ADMIN_CLIENT_PROFILES,
  MOCK_ADMIN_VIDEO_TICKETS,
  MOCK_STAFF_EDITORS,
  MOCK_STAFF_SMM,
  type AdminBatchFolder,
  type AdminClientProfile,
  type AdminVideoTicket,
  type BatchIntakePath,
  type BrandGuidelinesSource,
  type StaffMember,
  type VideoPipelineOwner,
} from '@mockData/index'
import type { ProvisionClientInput } from '@/components/admin/ProvisionClientModal'
import { nextStateAfterClientAction } from '@/lib/clientBoard'

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

function applyBatchCompletions(
  batches: AdminBatchFolder[],
  videos: AdminVideoTicket[],
  clients: AdminClientProfile[],
): { batches: AdminBatchFolder[]; clients: AdminClientProfile[] } {
  let nextBatches = batches
  let nextClients = clients

  for (const batch of batches) {
    if (batch.status !== 'active' || batch.creditsDebited) continue
    const batchVideos = videos.filter((v) => v.batchId === batch.id)
    if (batchVideos.length === 0) continue
    if (!batchVideos.every((v) => v.owner === 'done')) continue

    const now = new Date().toISOString().slice(0, 10)
    nextBatches = nextBatches.map((b) =>
      b.id === batch.id
        ? {
            ...b,
            status: 'completed' as const,
            completedAt: now,
            updatedAt: now,
            creditsDebited: true,
          }
        : b,
    )
    nextClients = nextClients.map((c) =>
      c.id === batch.clientId
        ? { ...c, credits: Math.max(0, c.credits - batch.creditCost) }
        : c,
    )
  }

  return { batches: nextBatches, clients: nextClients }
}

type AdminWorkspaceContextValue = {
  clients: AdminClientProfile[]
  batches: AdminBatchFolder[]
  videos: AdminVideoTicket[]
  smmStaff: StaffMember[]
  editorStaff: StaffMember[]
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
  setVideoDeadline: (videoId: string, deadlineAt: string | null) => void
  setVideoOwner: (videoId: string, owner: VideoPipelineOwner) => void
  submitBatchIntake: (
    batchId: string,
    path: BatchIntakePath,
    url: string,
  ) => void
  approveBatchClips: (batchId: string, clipReviewVideoId: string) => void
  rejectBatchClips: (
    batchId: string,
    clipReviewVideoId: string,
    note: string,
  ) => void
  applyClientVideoDecision: (
    videoId: string,
    action: 'approve' | 'reject',
  ) => void
}

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue | null>(
  null,
)

function staffName(list: StaffMember[], id: string) {
  return list.find((s) => s.id === id)?.name ?? '—'
}

export function AdminWorkspaceProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<AdminClientProfile[]>(() => [
    ...MOCK_ADMIN_CLIENT_PROFILES,
  ])
  const [batches, setBatches] = useState<AdminBatchFolder[]>(() => [
    ...MOCK_ADMIN_BATCH_FOLDERS,
  ])
  const [videos, setVideos] = useState<AdminVideoTicket[]>(() => [
    ...MOCK_ADMIN_VIDEO_TICKETS,
  ])

  useEffect(() => {
    const { batches: nextBatches, clients: nextClients } = applyBatchCompletions(
      batches,
      videos,
      clients,
    )
    if (JSON.stringify(nextBatches) !== JSON.stringify(batches)) {
      setBatches(nextBatches)
    }
    if (JSON.stringify(nextClients) !== JSON.stringify(clients)) {
      setClients(nextClients)
    }
    // Finalize batches when video pipeline changes; batches/clients from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally videos-only
  }, [videos])

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
    const defaultSmm = MOCK_STAFF_SMM[0]
    const defaultEditor = MOCK_STAFF_EDITORS[0]
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
  }, [])

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
          assignedSmmName: staffName(MOCK_STAFF_SMM, input.smmId),
          assignedEditorId: input.editorId,
          assignedEditorName: staffName(MOCK_STAFF_EDITORS, input.editorId),
        }
      }),
    )
  }, [])

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

  const setVideoDeadline = useCallback(
    (videoId: string, deadlineAt: string | null) => {
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, deadlineAt } : v)),
      )
    },
    [],
  )

  const setVideoOwner = useCallback(
    (videoId: string, owner: VideoPipelineOwner) => {
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== videoId) return v
          const deadlineRole =
            owner === 'smm' ? 'smm' : owner === 'editor' ? 'editor' : null
          return {
            ...v,
            owner,
            deadlineRole,
          }
        }),
      )
    },
    [],
  )

  const assignBatchVideosToEditor = useCallback((batchId: string) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.batchId !== batchId) return v
        if (v.stageLabel.toLowerCase().includes('clip review')) {
          return {
            ...v,
            owner: 'editor' as const,
            stageLabel: 'Editing in progress',
            deadlineRole: 'editor' as const,
          }
        }
        return {
          ...v,
          owner: 'editor' as const,
          stageLabel:
            v.stageLabel.toLowerCase().includes('editing') ||
            v.stageLabel.toLowerCase().includes('clip identification')
              ? 'Editing in progress'
              : v.stageLabel,
          deadlineRole: 'editor' as const,
        }
      }),
    )
  }, [])

  const submitBatchIntake = useCallback(
    (batchId: string, path: BatchIntakePath, url: string) => {
      const now = new Date().toISOString().slice(0, 10)
      const trimmed = url.trim()
      if (!trimmed) return

      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b
          if (path === 'clips_ready') {
            return {
              ...b,
              intakePath: path,
              clipsFolderUrl: trimmed,
              clipReviewPhase: 'approved',
              updatedAt: now,
            }
          }
          return {
            ...b,
            intakePath: path,
            sourceMediaUrl: trimmed,
            footageUrl: trimmed,
            clipReviewPhase: 'smm_identifying',
            updatedAt: now,
          }
        }),
      )

      if (path === 'clips_ready') {
        assignBatchVideosToEditor(batchId)
      }
    },
    [assignBatchVideosToEditor],
  )

  const approveBatchClips = useCallback(
    (batchId: string, clipReviewVideoId: string) => {
      const now = new Date().toISOString().slice(0, 10)
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? { ...b, clipReviewPhase: 'approved' as const, updatedAt: now }
            : b,
        ),
      )
      setVideos((prev) =>
        prev.map((v) => {
          if (v.batchId !== batchId) return v
          if (v.id === clipReviewVideoId) {
            return {
              ...v,
              owner: 'editor' as const,
              stageLabel: 'Editing in progress',
              deadlineRole: 'editor' as const,
            }
          }
          if (
            v.stageLabel.toLowerCase().includes('clip identification') ||
            v.stageLabel.toLowerCase().includes('clip review')
          ) {
            return {
              ...v,
              owner: 'editor' as const,
              stageLabel: 'Editing in progress',
              deadlineRole: 'editor' as const,
            }
          }
          return v
        }),
      )
    },
    [],
  )

  const rejectBatchClips = useCallback(
    (batchId: string, clipReviewVideoId: string, _note: string) => {
      const now = new Date().toISOString().slice(0, 10)
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? { ...b, clipReviewPhase: 'with_smm' as const, updatedAt: now }
            : b,
        ),
      )
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== clipReviewVideoId) return v
          return {
            ...v,
            owner: 'smm' as const,
            stageLabel: 'Clip identification',
            deadlineRole: 'smm' as const,
          }
        }),
      )
    },
    [],
  )

  const applyClientVideoDecision = useCallback(
    (videoId: string, action: 'approve' | 'reject') => {
      const now = new Date().toISOString().slice(0, 10)
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== videoId) return v
          const next = nextStateAfterClientAction(v, action)
          if (action === 'approve' && next.owner === 'scheduling') {
            return {
              ...v,
              ...next,
              owner: 'done' as const,
              stageLabel: 'Scheduled',
              deadlineRole: null,
            }
          }
          return { ...v, ...next }
        }),
      )
      setBatches((prev) =>
        prev.map((b) => {
          const video = videos.find((v) => v.id === videoId)
          if (!video || video.batchId !== b.id) return b
          return { ...b, updatedAt: now }
        }),
      )
    },
    [videos],
  )

  const value = useMemo(
    () => ({
      clients,
      batches,
      videos,
      smmStaff: MOCK_STAFF_SMM,
      editorStaff: MOCK_STAFF_EDITORS,
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
      setVideoDeadline,
      setVideoOwner,
      submitBatchIntake,
      approveBatchClips,
      rejectBatchClips,
      applyClientVideoDecision,
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
      setVideoDeadline,
      setVideoOwner,
      submitBatchIntake,
      approveBatchClips,
      rejectBatchClips,
      applyClientVideoDecision,
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
