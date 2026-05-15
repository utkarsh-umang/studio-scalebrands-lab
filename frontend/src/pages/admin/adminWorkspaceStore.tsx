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
  submitSmmClipsFolder: (batchId: string, clipsFolderUrl: string) => void
  submitSmmQaReview: (videoId: string, input: SubmitSmmQaInput) => void
  scheduleBatch: (batchId: string, input: ScheduleBatchInput) => void
  /** Moves `scheduling` → done if needed, then closes batch + debits credits when every deliverable is done. */
  smmFinalizeBatchPublish: (batchId: string) => void
  submitEditorVideosDrive: (batchId: string, driveUrl: string) => void
  submitEditorThumbnailsForReview: (batchId: string) => void
  submitEditorVideoTitle: (videoId: string, title: string) => void
  resubmitEditorVideoQa: (videoId: string) => void
}

export type SubmitSmmQaInput = {
  timestampFlags: { atSeconds: number; note: string }[]
  generalNote: string
  action: 'approve' | 'send_back'
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
  if (s.includes('idea')) return 'idea'
  if (s.includes('text review')) return 'text'
  if (s.includes('thumbnail review')) return 'thumbnail'
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

  const assignBatchVideosToEditor = useCallback((batchId: string) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.batchId !== batchId) return v
        if (v.stageLabel.toLowerCase().includes('clip review')) {
          return {
            ...v,
            owner: 'editor' as const,
            editorPhase: 'videos' as const,
            stageLabel: 'Videos in progress',
            deadlineRole: 'editor' as const,
          }
        }
        return {
          ...v,
          owner: 'editor' as const,
          editorPhase: 'videos' as const,
          stageLabel:
            v.stageLabel.toLowerCase().includes('editing') ||
            v.stageLabel.toLowerCase().includes('clip identification')
              ? 'Videos in progress'
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
      const manifest = getManifestForBatch(batchId)
      const clipCount = manifest?.clips.length ?? 0

      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? {
                ...b,
                clipReviewPhase: 'approved' as const,
                updatedAt: now,
                ...(clipCount > 0 ? { videoCount: clipCount } : {}),
              }
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
              editorPhase: 'videos' as const,
              stageLabel: 'Videos in progress',
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
              editorPhase: 'videos' as const,
              stageLabel: 'Videos in progress',
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
    (batchId: string, clipReviewVideoId: string, note: string) => {
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

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b
        return {
          ...b,
          intakePath: 'source_media' as const,
          clipsFolderUrl: trimmed,
          clipReviewPhase: 'awaiting_client' as const,
          updatedAt: now,
        }
      }),
    )

    setVideos((prev) => {
      const batchVideos = prev.filter((v) => v.batchId === batchId)
      const hasClipReview = batchVideos.some((v) =>
        v.stageLabel.toLowerCase().includes('clip review'),
      )
      const batch = batches.find((b) => b.id === batchId)
      if (!batch) return prev

      let next = prev.map((v) => {
        if (v.batchId !== batchId) return v
        if (v.stageLabel.toLowerCase().includes('clip identification')) {
          return {
            ...v,
            owner: 'client' as const,
            stageLabel: 'Clip review',
            deadlineRole: null,
          }
        }
        return v
      })

      if (!hasClipReview) {
        const clipReviewTicket: AdminVideoTicket = {
          id: `v-clip-${batchId}-${Date.now()}`,
          batchId,
          clientId: batch.clientId,
          title: 'Clip approval',
          owner: 'client',
          stageLabel: 'Clip review',
          deadlineRole: null,
          deadlineAt: null,
        }
        next = [clipReviewTicket, ...next]
      }

      return next
    })
  }, [batches])

  const submitSmmQaReview = useCallback(
    (videoId: string, input: SubmitSmmQaInput) => {
      const now = new Date().toISOString().slice(0, 10)
      const flags = input.timestampFlags.map((f, i) => ({
        id: `qf-${videoId}-${Date.now()}-${i}`,
        atSeconds: f.atSeconds,
        note: f.note,
      }))
      const hasFeedback =
        input.action === 'send_back' ||
        flags.length > 0 ||
        input.generalNote.trim().length > 0

      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== videoId) return v
          const videoVersion = v.assetVersions?.video ?? 1
          if (hasFeedback) {
            const newComments = buildQaCommentsFromFeedback(
              {
                markers: input.timestampFlags.map((f) => ({
                  at: f.atSeconds,
                  text: f.note,
                })),
                generalNote: input.generalNote,
              },
              { slot: 'video', assetVersion: videoVersion, authorRole: 'smm' },
            )
            return {
              ...v,
              owner: 'editor' as const,
              editorPhase: 'videos' as const,
              stageLabel: 'QA flagged',
              deadlineRole: 'editor' as const,
              lastRevisionRequestedBy: 'smm' as const,
              releasedToClientFinalVideoReview: false,
              qaFlags: flags,
              qaGeneralNote: input.generalNote.trim() || undefined,
              qaCommentHistory: [...(v.qaCommentHistory ?? []), ...newComments],
            }
          }
          return {
            ...v,
            owner: 'client' as const,
            stageLabel: 'Final video review',
            deadlineRole: null,
            releasedToClientFinalVideoReview: true,
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

  const submitEditorVideosDrive = useCallback(
    (batchId: string, driveUrl: string) => {
      const trimmed = driveUrl.trim()
      if (!trimmed) return
      const now = new Date().toISOString().slice(0, 10)

      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? {
                ...b,
                editorDeliverablesDriveUrl: trimmed,
                updatedAt: now,
              }
            : b,
        ),
      )

      setVideos((prev) =>
        prev.map((v) => {
          if (v.batchId !== batchId) return v
          if (v.editorPhase && v.editorPhase !== 'videos') return v
          return {
            ...v,
            editorPhase: 'videos' as const,
            owner: 'smm' as const,
            stageLabel: 'SMM QA',
            deadlineRole: 'smm' as const,
            releasedToClientFinalVideoReview: false,
          }
        }),
      )
    },
    [],
  )

  const submitEditorThumbnailsForReview = useCallback((batchId: string) => {
    const now = new Date().toISOString().slice(0, 10)
    setVideos((prev) =>
      prev.map((v) => {
        if (v.batchId !== batchId) return v
        if (v.editorPhase !== 'thumbnails') return v
        if (v.owner !== 'editor') return v
        return {
          ...v,
          owner: 'client' as const,
          stageLabel: 'Thumbnail review',
          deadlineRole: null,
        }
      }),
    )
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, updatedAt: now } : b)),
    )
  }, [])

  const submitEditorVideoTitle = useCallback((videoId: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const now = new Date().toISOString().slice(0, 10)

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v
        return {
          ...v,
          editorPublishTitle: trimmed,
          editorPhase: 'handed_off' as const,
          owner: 'smm' as const,
          stageLabel: 'Editor handoff',
          deadlineRole: 'smm' as const,
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

  const resubmitEditorVideoQa = useCallback((videoId: string) => {
    const now = new Date().toISOString().slice(0, 10)
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v
        const backToClient = v.lastRevisionRequestedBy === 'client'
        return {
          ...v,
          owner: backToClient ? ('client' as const) : ('smm' as const),
          editorPhase: 'videos' as const,
          stageLabel: backToClient ? 'Final video review' : 'SMM QA',
          deadlineRole: backToClient ? null : ('smm' as const),
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
        return {
          ...v,
          owner: 'done' as const,
          stageLabel: 'Scheduled',
          deadlineRole: null,
        }
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
            return {
              ...v,
              owner: 'done' as const,
              stageLabel: 'Scheduled',
              deadlineRole: null,
            }
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
              return {
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
              }
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
            const slot = kind === 'thumbnail' ? 'thumbnail' : 'video'
            const version = v.assetVersions?.[slot] ?? 1
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

          if (action === 'approve') {
            if (kind === 'final' && v.editorPhase === 'videos') {
              editorPhase = 'thumbnails'
            }
            if (kind === 'thumbnail') {
              editorPhase = 'titles'
            }
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
      submitSmmClipsFolder,
      submitSmmQaReview,
      scheduleBatch,
      smmFinalizeBatchPublish,
      submitEditorVideosDrive,
      submitEditorThumbnailsForReview,
      submitEditorVideoTitle,
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
      submitSmmClipsFolder,
      submitSmmQaReview,
      scheduleBatch,
      smmFinalizeBatchPublish,
      submitEditorVideosDrive,
      submitEditorThumbnailsForReview,
      submitEditorVideoTitle,
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
