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
  type VideoPipelineOwner,
} from '@mockData/index'
import type { ProvisionClientInput } from '@/components/admin/ProvisionClientModal'
import {
  nextStateAfterClientAction,
  type ClientReviewKind,
} from '@/lib/clientBoard'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'
import { buildQaCommentsFromFeedback } from '@/lib/qaComments'
import {
  batchDemoStageAfterScheduleComplete,
  patchBatchDemoStage,
  videoStateFromDemoStage,
} from '@/lib/pathBStateMachine'

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
  setVideoDeadline: (videoId: string, deadlineAt: string | null) => void
  setVideoOwner: (videoId: string, owner: VideoPipelineOwner) => void
  applyClientVideoDecision: (
    videoId: string,
    action: 'approve' | 'reject',
    opts?: { rejectNote?: string; feedback?: VideoReviewFeedback },
  ) => void
  appendClientQaComment: (videoId: string, body: string) => void
  submitSmmQaReview: (videoId: string, input: SubmitSmmQaInput) => void
  appendSmmQaComment: (videoId: string, body: string) => void
  smmTriageClientRevision: (
    videoId: string,
    route: 'editor' | 'smm_assets',
  ) => void
  /** Marks one video scheduled (scheduling → done). Debits batch credits when all deliverables are done. */
  scheduleVideo: (videoId: string, input: ScheduleVideoInput) => void
  sendEditorDeliverableToSmmQa: (videoId: string) => void
  saveVideoPublishTitle: (videoId: string, title: string) => void
  resubmitEditorVideoQa: (videoId: string) => void
}

export type SubmitSmmQaInput = {
  action: 'approve' | 'send_back'
  /** Path B QA workspace — plain-text send-back */
  commentBody?: string
  /** Legacy timestamp QA panel */
  timestampFlags?: { atSeconds: number; note: string }[]
  generalNote?: string
}

export type ScheduleVideoInput = {
  platform: string
  goLiveDate: string
  goLiveTime: string
}

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue | null>(
  null,
)

function staffName(list: StaffMember[], id: string) {
  return list.find((s) => s.id === id)?.name ?? '—'
}

function reviewKindFromStage(stageLabel: string): ClientReviewKind | null {
  const s = stageLabel.toLowerCase()
  if (s.includes('clip review')) return 'clip'
  if (s.includes('client qa')) return 'final'
  if (s.includes('final')) return 'final'
  return null
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

  const submitSmmQaReview = useCallback(
    (videoId: string, input: SubmitSmmQaInput) => {
      const now = new Date().toISOString().slice(0, 10)
      const timestampFlags = input.timestampFlags ?? []
      const generalNote = input.generalNote ?? ''
      const commentBody = input.commentBody?.trim() ?? ''
      const flags = timestampFlags.map((f, i) => ({
        id: `qf-${videoId}-${Date.now()}-${i}`,
        atSeconds: f.atSeconds,
        note: f.note,
      }))
      const hasFeedback =
        input.action === 'send_back' &&
        (commentBody.length > 0 ||
          flags.length > 0 ||
          generalNote.trim().length > 0)

      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== videoId) return v
          const videoVersion = v.assetVersions?.video ?? 1
          if (input.action === 'send_back') {
            if (!hasFeedback) return v
            const createdAt = new Date().toISOString()
            const newComments = commentBody
              ? [
                  {
                    id: `qc-smm-${Date.now()}`,
                    slot: 'video' as const,
                    assetVersion: videoVersion,
                    kind: 'general' as const,
                    authorRole: 'smm' as const,
                    body: commentBody,
                    createdAt,
                    deprecated: false,
                  },
                ]
              : buildQaCommentsFromFeedback(
                  {
                    markers: timestampFlags.map((f) => ({
                      at: f.atSeconds,
                      text: f.note,
                    })),
                    generalNote,
                  },
                  { slot: 'video', assetVersion: videoVersion, authorRole: 'smm' },
                )
            return {
              ...v,
              ...videoStateFromDemoStage('editor_fix'),
              lastRevisionRequestedBy: 'smm' as const,
              qaFlags: flags.length > 0 ? flags : undefined,
              qaGeneralNote: generalNote.trim() || commentBody || undefined,
              qaCommentHistory: [...(v.qaCommentHistory ?? []), ...newComments],
            }
          }
          return {
            ...v,
            ...videoStateFromDemoStage('client_qa'),
            qaFlags: undefined,
            qaGeneralNote: undefined,
          }
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

  const appendSmmQaComment = useCallback((videoId: string, body: string) => {
    const trimmed = body.trim()
    if (!trimmed) return
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v
        return {
          ...v,
          qaCommentHistory: [
            ...(v.qaCommentHistory ?? []),
            {
              id: `qc-smm-${Date.now()}`,
              slot: 'video' as const,
              assetVersion: v.assetVersions?.video ?? 1,
              kind: 'general' as const,
              authorRole: 'smm' as const,
              body: trimmed,
              createdAt: new Date().toISOString(),
              deprecated: false,
            },
          ],
        }
      }),
    )
  }, [])

  const smmTriageClientRevision = useCallback(
    (videoId: string, route: 'editor' | 'smm_assets') => {
      const now = new Date().toISOString().slice(0, 10)
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== videoId) return v
          if (route === 'editor') {
            return {
              ...v,
              ...videoStateFromDemoStage('editor_fix'),
              lastRevisionRequestedBy: 'smm' as const,
            }
          }
          return {
            ...v,
            ...videoStateFromDemoStage('production', {
              owner: 'smm',
              deadlineRole: 'smm',
            }),
            lastRevisionRequestedBy: 'client' as const,
          }
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

  const sendEditorDeliverableToSmmQa = useCallback((videoId: string) => {
    const now = new Date().toISOString().slice(0, 10)
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v
        return { ...v, ...videoStateFromDemoStage('smm_qa') }
      }),
    )
    setBatches((prev) =>
      prev.map((b) => {
        const video = videos.find((v) => v.id === videoId)
        if (!video || video.batchId !== b.id) return b
        return { ...b, updatedAt: now }
      }),
    )
  }, [videos])

  const saveVideoPublishTitle = useCallback((videoId: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, editorPublishTitle: trimmed } : v)),
    )
  }, [])

  const resubmitEditorVideoQa = useCallback((videoId: string) => {
    const now = new Date().toISOString().slice(0, 10)
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v
        const nextVideoVersion = (v.assetVersions?.video ?? 1) + 1
        const qaCommentHistory = (v.qaCommentHistory ?? []).map((c) =>
          c.slot === 'video' && !c.deprecated ? { ...c, deprecated: true as const } : c,
        )
        return {
          ...v,
          ...videoStateFromDemoStage('smm_qa'),
          qaFlags: undefined,
          qaGeneralNote: undefined,
          assetVersions: { ...v.assetVersions, video: nextVideoVersion },
          qaCommentHistory,
        }
      }),
    )
    setBatches((prev) =>
      prev.map((b) => {
        const video = videos.find((v) => v.id === videoId)
        if (!video || video.batchId !== b.id) return b
        return { ...b, updatedAt: now }
      }),
    )
  }, [videos])

  const scheduleVideo = useCallback(
    (videoId: string, input: ScheduleVideoInput) => {
      const target = videos.find((v) => v.id === videoId)
      if (!target || target.owner !== 'scheduling') return

      const goLiveAt = new Date(`${input.goLiveDate}T${input.goLiveTime}`).toISOString()
      const scheduledAt = new Date().toISOString()
      const batchId = target.batchId
      const batchSnapshot = batches.find((b) => b.id === batchId)
      if (!batchSnapshot) return

      setVideos((prevVideos) => {
        const nextVideos = prevVideos.map((v) => {
          if (v.id !== videoId) return v
          if (v.owner !== 'scheduling') return v
          return {
            ...v,
            ...videoStateFromDemoStage('completed', { stageLabel: 'Scheduled' }),
            videoSchedule: {
              platform: input.platform.trim(),
              goLiveAt,
              scheduledAt,
            },
          }
        })

        const batchDeliverables = nextVideos.filter(
          (v) =>
            v.batchId === batchId &&
            v.deliverableIndex != null &&
            v.deliverableIndex > 0,
        )
        const allDone =
          batchDeliverables.length > 0 &&
          batchDeliverables.every((v) => v.owner === 'done')

        if (allDone && !batchSnapshot.creditsDebited) {
          const now = new Date().toISOString().slice(0, 10)
          setBatches((prev) =>
            prev.map((b) => {
              if (b.id !== batchId) return b
              return patchBatchDemoStage(
                {
                  ...b,
                  status: 'completed' as const,
                  completedAt: now,
                  updatedAt: now,
                  creditsDebited: true,
                  batchSchedule: {
                    platform: input.platform.trim(),
                    goLiveAt,
                    completedAt: now,
                  },
                },
                batchDemoStageAfterScheduleComplete(),
              )
            }),
          )
          setClients((prev) =>
            prev.map((c) =>
              c.id === batchSnapshot.clientId
                ? {
                    ...c,
                    credits: Math.max(0, c.credits - batchSnapshot.creditCost),
                  }
                : c,
            ),
          )
        } else {
          const now = new Date().toISOString().slice(0, 10)
          setBatches((prev) =>
            prev.map((b) =>
              b.id === batchId ? { ...b, updatedAt: now } : b,
            ),
          )
        }

        return nextVideos
      })
    },
    [videos, batches],
  )

  const applyClientVideoDecision = useCallback(
    (
      videoId: string,
      action: 'approve' | 'reject',
      opts?: { rejectNote?: string; feedback?: VideoReviewFeedback },
    ) => {
      const now = new Date().toISOString().slice(0, 10)
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== videoId) return v
          const next = nextStateAfterClientAction(v, action)
          const kind = reviewKindFromStage(v.stageLabel)
          let editorPhase = v.editorPhase
          let qaCommentHistory = v.qaCommentHistory

          if (action === 'reject') {
            const slot = 'video' as const
            const version = v.assetVersions?.video ?? 1
            if (opts?.feedback) {
              const added = buildQaCommentsFromFeedback(opts.feedback, {
                slot,
                assetVersion: version,
                authorRole: 'client',
              })
              qaCommentHistory = [...(qaCommentHistory ?? []), ...added]
            } else if (opts?.rejectNote?.trim()) {
              qaCommentHistory = [
                ...(qaCommentHistory ?? []),
                {
                  id: `qc-${Date.now()}`,
                  slot,
                  assetVersion: version,
                  kind: 'general' as const,
                  authorRole: 'client' as const,
                  body: opts.rejectNote.trim(),
                  createdAt: new Date().toISOString(),
                  deprecated: false,
                },
              ]
            }
          }

          if (action === 'approve' && kind === 'clip') {
            editorPhase = 'videos'
          }
          if (action === 'approve' && kind === 'final') {
            editorPhase = 'handed_off'
          }

          const patch = {
            ...v,
            ...next,
            editorPhase,
            qaCommentHistory,
            ...(action === 'reject'
              ? { lastRevisionRequestedBy: 'client' as const }
              : {}),
          }

          return patch
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

  const appendClientQaComment = useCallback((videoId: string, body: string) => {
    const trimmed = body.trim()
    if (!trimmed) return
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v
        return {
          ...v,
          qaCommentHistory: [
            ...(v.qaCommentHistory ?? []),
            {
              id: `qc-client-${Date.now()}`,
              slot: 'video' as const,
              assetVersion: v.assetVersions?.video ?? 1,
              kind: 'general' as const,
              authorRole: 'client' as const,
              body: trimmed,
              createdAt: new Date().toISOString(),
              deprecated: false,
            },
          ],
        }
      }),
    )
  }, [])

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
      setVideoDeadline,
      setVideoOwner,
      applyClientVideoDecision,
      appendClientQaComment,
      submitSmmQaReview,
      appendSmmQaComment,
      smmTriageClientRevision,
      scheduleVideo,
      sendEditorDeliverableToSmmQa,
      saveVideoPublishTitle,
      resubmitEditorVideoQa,
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
      applyClientVideoDecision,
      appendClientQaComment,
      submitSmmQaReview,
      appendSmmQaComment,
      smmTriageClientRevision,
      scheduleVideo,
      sendEditorDeliverableToSmmQa,
      saveVideoPublishTitle,
      resubmitEditorVideoQa,
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
