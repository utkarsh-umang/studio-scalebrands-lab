import {
  createContext,
  useCallback,
  useContext,
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
import {
  nextStateAfterClientAction,
  type ClientReviewKind,
} from '@/lib/clientBoard'
import { getManifestForBatch } from '@/lib/driveMedia'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'
import {
  appendClipRejectNote,
  buildQaCommentsFromFeedback,
} from '@/lib/qaComments'
import {
  batchClipReviewPhaseAfterIntake,
  batchDemoStageAfterClipApproval,
  batchDemoStageAfterDeliverablesSplit,
  batchDemoStageAfterIntake,
  batchDemoStageAfterScheduleComplete,
  batchDemoStageAfterSmmClipsFolder,
  createClipReviewGateTicket,
  createPreSplitGateTicket,
  createSplitDeliverableTicket,
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
    opts?: { rejectNote?: string; feedback?: VideoReviewFeedback },
  ) => void
  appendClientQaComment: (videoId: string, body: string) => void
  submitSmmClipsFolder: (batchId: string, clipsFolderUrl: string) => void
  submitSmmQaReview: (videoId: string, input: SubmitSmmQaInput) => void
  appendSmmQaComment: (videoId: string, body: string) => void
  smmTriageClientRevision: (
    videoId: string,
    route: 'editor' | 'smm_assets',
  ) => void
  scheduleBatch: (batchId: string, input: ScheduleBatchInput) => void
  /** Moves `scheduling` → done if needed, then closes batch + debits credits when every deliverable is done. */
  smmFinalizeBatchPublish: (batchId: string) => void
  submitEditorVideosDrive: (batchId: string, driveUrl: string) => void
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

export type ScheduleBatchVideoInput = {
  videoId: string
  publishLink?: string
}

export type ScheduleBatchInput = {
  platform: string
  goLiveDate: string
  goLiveTime: string
  videos: ScheduleBatchVideoInput[]
  /** SMM attests every video in the batch is scheduled on the platform */
  allVideosScheduled: boolean
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
  const [clients, setClients] = useState<AdminClientProfile[]>(() => [
    ...MOCK_ADMIN_CLIENT_PROFILES,
  ])
  const [batches, setBatches] = useState<AdminBatchFolder[]>(() => [
    ...MOCK_ADMIN_BATCH_FOLDERS,
  ])
  const [videos, setVideos] = useState<AdminVideoTicket[]>(() => [
    ...MOCK_ADMIN_VIDEO_TICKETS,
  ])

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

  const submitBatchIntake = useCallback(
    (batchId: string, path: BatchIntakePath, url: string) => {
      const now = new Date().toISOString().slice(0, 10)
      const trimmed = url.trim()
      if (!trimmed) return

      const batchSnapshot = batches.find((b) => b.id === batchId)
      if (!batchSnapshot) return

      const batchDemoStage = batchDemoStageAfterIntake(path)
      const clipReviewPhase = batchClipReviewPhaseAfterIntake(path)

      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b
          if (path === 'clips_ready') {
            return patchBatchDemoStage(
              {
                ...b,
                intakePath: path,
                clipsFolderUrl: trimmed,
                clipReviewPhase,
                updatedAt: now,
              },
              batchDemoStage,
            )
          }
          return patchBatchDemoStage(
            {
              ...b,
              intakePath: path,
              sourceMediaUrl: trimmed,
              footageUrl: trimmed,
              clipReviewPhase,
              updatedAt: now,
            },
            batchDemoStage,
          )
        }),
      )

      if (path === 'clips_ready') {
        const gateId = `v-gate-${batchId}-${Date.now()}`
        const gate = createPreSplitGateTicket(
          { ...batchSnapshot, clipsFolderUrl: trimmed, clipReviewPhase: 'approved' },
          gateId,
          'clips_ready_intake',
        )
        setVideos((prev) => [
          gate,
          ...prev.filter((v) => v.batchId !== batchId),
        ])
      } else {
        setVideos((prev) => prev.filter((v) => v.batchId !== batchId))
      }
    },
    [batches],
  )

  const approveBatchClips = useCallback(
    (batchId: string, clipReviewVideoId: string) => {
      const now = new Date().toISOString().slice(0, 10)
      const manifest = getManifestForBatch(batchId)
      const clipCount = manifest?.clips.length ?? 0
      const gateState = videoStateFromDemoStage('pre_split_production')

      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? patchBatchDemoStage(
                {
                  ...b,
                  clipReviewPhase: 'approved' as const,
                  updatedAt: now,
                  ...(clipCount > 0 ? { videoCount: clipCount } : {}),
                },
                batchDemoStageAfterClipApproval(),
              )
            : b,
        ),
      )
      setVideos((prev) =>
        prev.map((v) => {
          if (v.batchId !== batchId) return v
          if (v.id === clipReviewVideoId || isPreSplitGateOrClipReview(v)) {
            return { ...v, ...gateState }
          }
          return v
        }),
      )
    },
    [],
  )

  function isPreSplitGateOrClipReview(v: AdminVideoTicket): boolean {
    const stage = v.stageLabel.toLowerCase()
    return (
      stage.includes('clip identification') ||
      stage.includes('clip review') ||
      v.deliverableIndex == null ||
      v.deliverableIndex < 1
    )
  }

  const rejectBatchClips = useCallback(
    (batchId: string, clipReviewVideoId: string, note: string) => {
      const now = new Date().toISOString().slice(0, 10)
      const smmIdentifying = videoStateFromDemoStage('clips_identifying')

      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? patchBatchDemoStage(
                { ...b, clipReviewPhase: 'with_smm' as const, updatedAt: now },
                'clips_identifying',
              )
            : b,
        ),
      )
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== clipReviewVideoId) return v
          return {
            ...v,
            ...smmIdentifying,
            qaCommentHistory: appendClipRejectNote(v, note),
          }
        }),
      )
    },
    [],
  )

  const submitSmmClipsFolder = useCallback((batchId: string, clipsFolderUrl: string) => {
    const trimmed = clipsFolderUrl.trim()
    if (!trimmed) return
    const now = new Date().toISOString().slice(0, 10)
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return

    const clipReviewState = videoStateFromDemoStage('clip_client_review')

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b
        return patchBatchDemoStage(
          {
            ...b,
            intakePath: 'source_media' as const,
            clipsFolderUrl: trimmed,
            clipReviewPhase: 'awaiting_client' as const,
            updatedAt: now,
          },
          batchDemoStageAfterSmmClipsFolder(),
        )
      }),
    )

    setVideos((prev) => {
      const batchVideos = prev.filter((v) => v.batchId === batchId)
      const hasClipReview = batchVideos.some((v) =>
        v.stageLabel.toLowerCase().includes('clip review'),
      )

      let next = prev.map((v) => {
        if (v.batchId !== batchId) return v
        if (v.stageLabel.toLowerCase().includes('clip identification')) {
          return { ...v, ...clipReviewState }
        }
        return v
      })

      if (!hasClipReview) {
        const clipReviewTicket = createClipReviewGateTicket(
          batch,
          `v-clip-${batchId}-${Date.now()}`,
        )
        next = [clipReviewTicket, ...next]
      }

      return next
    })
  }, [batches])

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

  const submitEditorVideosDrive = useCallback((batchId: string, driveUrl: string) => {
    const trimmed = driveUrl.trim()
    if (!trimmed) return
    const now = new Date().toISOString().slice(0, 10)
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return

    const manifest = getManifestForBatch(batchId)
    const clipCount = manifest?.clips.length ?? 0
    const videoCount = manifest?.videos.length ?? 0
    const n = Math.max(clipCount, videoCount, batch.videoCount, 1)
    const ts = Date.now()

    const newTickets: AdminVideoTicket[] = Array.from({ length: n }, (_, i) => {
      const index = i + 1
      const clip = manifest?.clips.find((c) => c.index === index)
      const video = manifest?.videos.find((v) => v.index === index)
      return createSplitDeliverableTicket(
        batch,
        index,
        `v-${batchId}-d${index}-${ts}-${i}`,
        clip?.name ?? video?.name ?? `Deliverable ${index}`,
      )
    })

    setVideos((vPrev) => [
      ...vPrev.filter((v) => v.batchId !== batchId),
      ...newTickets,
    ])

    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? patchBatchDemoStage(
              {
                ...b,
                editorDeliverablesDriveUrl: trimmed,
                videoCount: n,
                updatedAt: now,
              },
              batchDemoStageAfterDeliverablesSplit(),
            )
          : b,
      ),
    )
  }, [batches])

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

  const scheduleBatch = useCallback((batchId: string, input: ScheduleBatchInput) => {
    if (!input.allVideosScheduled) return
    const now = new Date().toISOString().slice(0, 10)
    const goLiveAt = new Date(`${input.goLiveDate}T${input.goLiveTime}`).toISOString()
    const linkByVideoId = Object.fromEntries(
      input.videos.map((v) => [v.videoId, v.publishLink?.trim() || undefined]),
    )

    setVideos((prev) =>
      prev.map((v) => {
        if (v.batchId !== batchId) return v
        if (v.owner !== 'scheduling') return v
        return { ...v, ...videoStateFromDemoStage('completed') }
      }),
    )
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              updatedAt: now,
              batchSchedule: {
                platform: input.platform,
                goLiveAt,
                completedAt: now,
                videoPublishLinks: linkByVideoId,
              },
            }
          : b,
      ),
    )
  }, [])

  const smmFinalizeBatchPublish = useCallback(
    (batchId: string) => {
      const batchSnapshot = batches.find((b) => b.id === batchId)
      if (
        !batchSnapshot ||
        batchSnapshot.status !== 'active' ||
        batchSnapshot.creditsDebited
      )
        return

      setVideos((prevVideos) => {
        const nextVideos = prevVideos.map((v) => {
          if (v.batchId !== batchId) return v
          if (v.owner === 'scheduling') {
            return { ...v, ...videoStateFromDemoStage('completed') }
          }
          return v
        })

        const bv = nextVideos.filter((v) => v.batchId === batchId)
        const allDone =
          bv.length > 0 && bv.every((v) => v.owner === 'done')

        if (allDone) {
          const now = new Date().toISOString().slice(0, 10)
          const goLiveAt = new Date().toISOString()
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
                  batchSchedule:
                    b.batchSchedule ?? {
                      platform: 'Social channels',
                      goLiveAt,
                      completedAt: now,
                      videoPublishLinks: {},
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
        }

        return nextVideos
      })
    },
    [batches],
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
      appendClientQaComment,
      submitSmmClipsFolder,
      submitSmmQaReview,
      appendSmmQaComment,
      smmTriageClientRevision,
      scheduleBatch,
      smmFinalizeBatchPublish,
      submitEditorVideosDrive,
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
      submitBatchIntake,
      approveBatchClips,
      rejectBatchClips,
      applyClientVideoDecision,
      appendClientQaComment,
      submitSmmClipsFolder,
      submitSmmQaReview,
      appendSmmQaComment,
      smmTriageClientRevision,
      scheduleBatch,
      smmFinalizeBatchPublish,
      submitEditorVideosDrive,
      sendEditorDeliverableToSmmQa,
      saveVideoPublishTitle,
      resubmitEditorVideoQa,
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
