import { useMemo } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  Film,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/auth'
import { ClipsReviewPanel } from '@/components/drive/ClipsReviewPanel'
import { EditorBatchUploadPanel } from '@/components/editor/EditorBatchUploadPanel'
import { EditorSourceClipsPanel } from '@/components/editor/EditorSourceClipsPanel'
import { DriveAccessNotice } from '@/components/path-b/DriveAccessNotice'
import { DriveSyncButton } from '@/components/path-b/DriveSyncButton'
import { DriveSyncMeta } from '@/components/path-b/DriveSyncMeta'
import {
  useApproveBatchClipsMutation,
  useRejectBatchClipsMutation,
} from '@/hooks/api/pathB/useClipsFolderMutations'
import { useRoleWorkspace } from '@/hooks/api/workspace/useRoleWorkspace'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'
import { toClientVideoCard } from '@/lib/clientBoard'
import { videoEditorQaReturn } from '@/lib/editorBoard'
import { studioMediaSlot } from '@/lib/studioMedia'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'

type WorkspaceRole = 'client' | 'editor' | 'smm'

function roleFromUser(
  user:
    | { role: 'client' }
    | { role: 'admin' }
    | { role: 'employee'; employeeKind?: string | null }
    | null,
): WorkspaceRole | null {
  if (user?.role === 'client') return 'client'
  if (user?.role === 'employee' && user.employeeKind === 'editor') return 'editor'
  if (user?.role === 'employee' && user.employeeKind === 'smm') return 'smm'
  return null
}

function workspaceCopy(role: WorkspaceRole, canClientReview: boolean) {
  if (role === 'client' && canClientReview) {
    return {
      eyebrow: 'Approval required',
      title: 'Review the selected clips',
    }
  }
  if (role === 'editor') {
    return {
      eyebrow: 'Production handoff',
      title: 'Review clips and submit deliverables',
    }
  }
  return {
    eyebrow: 'Source clips',
    title: 'Review the numbered clip set',
  }
}

type StageBanner = {
  label: string
  title: string
  description: string
  kind: 'action' | 'production' | 'waiting' | 'revision'
}

function stageBannerFor(
  batch: AdminBatchFolder,
  role: WorkspaceRole,
  canClientReview: boolean,
  videoCount: number,
  tickets: AdminVideoTicket[],
): StageBanner {
  const countLabel = `${videoCount || 'The'} ${videoCount === 1 ? 'video' : 'videos'}`
  const verb = videoCount === 1 ? 'is' : 'are'

  if (canClientReview) {
    return {
      label: 'Action required from you',
      title: 'These clips are not approved yet',
      description:
        'Production is paused until you approve the full set or mark the clips that need a replacement.',
      kind: 'action',
    }
  }

  if (batch.clipReviewPhase === 'awaiting_client') {
    return {
      label: 'Waiting on client',
      title: 'The clips are waiting for approval',
      description:
        role === 'client'
          ? 'This clip set is in review, but there is no approval action attached to your account yet.'
          : 'The editor has not started production yet. The client needs to approve this clip set first.',
      kind: 'waiting',
    }
  }

  if (
    batch.clipReviewPhase === 'with_smm' ||
    batch.clipReviewPhase === 'smm_identifying'
  ) {
    return {
      label: 'Clip selection in progress',
      title: 'The clip set is being prepared',
      description:
        'The social media team is selecting or replacing clips before the set can move into production.',
      kind: 'revision',
    }
  }

  const indexedTickets = tickets.filter(
    (ticket) => ticket.deliverableIndex != null && ticket.deliverableIndex > 0,
  )
  const editorCount = indexedTickets.filter(
    (ticket) => ticket.owner === 'editor',
  ).length
  const qaCount = indexedTickets.filter(
    (ticket) =>
      ticket.owner === 'smm' && ticket.stageLabel.toLowerCase().includes('qa'),
  ).length
  const revisionCount = indexedTickets.filter(videoEditorQaReturn).length

  if (role === 'editor' && revisionCount > 0) {
    return {
      label: 'Changes requested',
      title: `${revisionCount} ${revisionCount === 1 ? 'video needs' : 'videos need'} a QA fix`,
      description: 'Open each flagged video below, address the comments, and resubmit it to SMM QA.',
      kind: 'action',
    }
  }

  if (role === 'editor' && qaCount > 0) {
    if (editorCount === 0) {
      return {
        label: 'Internal QA in progress',
        title: `${qaCount} ${qaCount === 1 ? 'video is' : 'videos are'} with SMM QA`,
        description:
          'Your finished uploads are secured in Studio. No action is needed unless QA sends a video back with changes.',
        kind: 'waiting',
      }
    }
    return {
      label: 'Production handoff in progress',
      title: `${editorCount} ${editorCount === 1 ? 'video still needs' : 'videos still need'} your attention`,
      description: `${qaCount} ${qaCount === 1 ? 'video has' : 'videos have'} already moved to SMM QA. Finish and send the remaining work below.`,
      kind: 'production',
    }
  }

  if (batch.clipReviewPhase === 'approved' && !batch.editorDeliverablesDriveUrl?.trim()) {
    return {
      label: 'Clips approved · Production started',
      title:
        role === 'editor'
          ? `${countLabel} ${verb} ready for you to edit`
          : `Your editor is working on ${countLabel.toLowerCase()}`,
      description:
        role === 'editor'
          ? 'Use the client uploads below as your source, then upload each matching finished video directly to Studio.'
          : 'No action is needed right now. Each approved clip is tracked as its own video while the editor produces the final assets.',
      kind: 'production',
    }
  }

  return {
    label: 'Video production in progress',
    title: `${countLabel} ${verb} moving through production`,
    description:
      'The approved clips have been split into individual videos, each with its own production and review stage.',
    kind: 'production',
  }
}

type ContentProps = {
  batch: AdminBatchFolder
  tickets: AdminVideoTicket[]
  clientName: string
  role: WorkspaceRole
  backPath: string
}

function ClipsWorkspaceContent({
  batch,
  tickets,
  clientName,
  role,
  backPath,
}: ContentProps) {
  const navigate = useNavigate()
  const studioSourceTickets = useMemo(
    () => tickets.filter((ticket) => studioMediaSlot(ticket, 'source_clip')),
    [tickets],
  )
  const hasDriveSource = Boolean(batch.clipsFolderUrl?.trim())
  const hasStudioSource = studioSourceTickets.length > 0
  const { manifest, syncing, error, sync } = useDriveManifestSync(
    batch.id,
    `${batch.id}-${role}-clips-page`,
    hasDriveSource,
  )
  const approveBatchClips = useApproveBatchClipsMutation(batch.id)
  const rejectBatchClips = useRejectBatchClipsMutation(batch.id)

  const clientReviewTicket = useMemo(
    () =>
      tickets.find((ticket) => {
        const card = toClientVideoCard(ticket, batch)
        return card.reviewKind === 'clip' && card.clientColumn === 'in_review'
      }),
    [batch, tickets],
  )

  const canClientReview = role === 'client' && Boolean(clientReviewTicket)
  const copy = workspaceCopy(role, canClientReview)
  const readOnly = !canClientReview
  const clipsCount = hasStudioSource
    ? studioSourceTickets.length
    : (manifest?.clips.length ?? 0)
  const ticketCount = tickets.filter(
    (ticket) => ticket.deliverableIndex != null && ticket.deliverableIndex > 0,
  ).length
  const knownVideoCount = Math.max(clipsCount, batch.videoCount, ticketCount)
  const stageBanner = stageBannerFor(
    batch,
    role,
    canClientReview,
    knownVideoCount,
    tickets,
  )
  const StageIcon =
    stageBanner.kind === 'action'
      ? CircleAlert
      : stageBanner.kind === 'production'
        ? Film
        : stageBanner.kind === 'waiting'
          ? Clock3
          : CheckCircle2

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          navigate(backPath)
        }}
        className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-950"
      >
        <span className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-transform group-hover:-translate-x-0.5">
          <ArrowLeft className="size-3.5" aria-hidden />
        </span>
        Back to workflow
      </button>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
        <header className="border-b border-slate-100 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-blue-700">
                  {copy.eyebrow}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {knownVideoCount} {knownVideoCount === 1 ? 'clip' : 'clips'}
                </span>
              </div>
              <h1 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950 md:text-2xl">
                {copy.title}
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span className="text-slate-900">{batch.title}</span>
                <span aria-hidden>·</span>
                <span>{clientName}</span>
                <span aria-hidden>·</span>
                <span>Batch {batch.batchNumber}</span>
              </p>
            </div>

            {hasDriveSource ? (
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <DriveSyncButton
                  onSync={() => {
                    void sync()
                  }}
                  syncing={syncing}
                  className="bg-white"
                />
                <a
                  href={batch.clipsFolderUrl ?? ''}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <FolderOpen className="size-3.5" aria-hidden />
                  Open clips folder
                  <ExternalLink className="size-3 opacity-60" aria-hidden />
                </a>
              </div>
            ) : (
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                <ShieldCheck className="size-3.5" aria-hidden />
                Source files secured in Studio
              </span>
            )}
          </div>
          {hasDriveSource ? (
            <div className="mt-4 text-[11px] text-slate-400">
              <DriveSyncMeta manifest={manifest} errorMessage={error} />
            </div>
          ) : null}
        </header>

        <div className="space-y-3 bg-slate-50/65 p-3 md:p-4">
          <section
            className={[
              'relative overflow-hidden rounded-xl px-4 py-3.5 text-white shadow-sm md:px-5',
              stageBanner.kind === 'action' ? 'bg-blue-600' : 'bg-[#0a1222]',
            ].join(' ')}
          >
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40"
              style={{
                background:
                  'radial-gradient(circle at 80% 30%, rgba(96,165,250,0.55), transparent 52%)',
              }}
              aria-hidden
            />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <StageIcon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-200">
                  {stageBanner.label}
                </p>
                <h2 className="mt-1 text-base font-bold tracking-[-0.02em] md:text-lg">
                  {stageBanner.title}
                </h2>
              </div>
              {knownVideoCount > 0 ? (
                <span className="relative shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  {knownVideoCount} {knownVideoCount === 1 ? 'video' : 'videos'}
                </span>
              ) : null}
            </div>
          </section>

          {hasStudioSource && role === 'editor' ? (
            <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,0.8fr)]">
              <EditorSourceClipsPanel tickets={tickets} />
              <EditorBatchUploadPanel batch={batch} tickets={tickets} />
            </div>
          ) : hasStudioSource ? (
            <EditorSourceClipsPanel tickets={tickets} />
          ) : (
            <>
              <DriveAccessNotice
                diagnostics={manifest?.diagnostics}
                slot="clips"
                unmapped={manifest?.unmapped}
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
                <ClipsReviewPanel
                  batchId={batch.id}
                  manifest={manifest}
                  clipsFolderUrl={batch.clipsFolderUrl ?? ''}
                  pageLayout
                  readOnly={readOnly}
                  sidebarPosition="left"
                  onApprove={
                    canClientReview
                      ? () => {
                          if (!clientReviewTicket) return
                          approveBatchClips.mutate(
                            {
                              videoTicketId: clientReviewTicket.id,
                              ...(clipsCount > 0 ? { clipCount: clipsCount } : {}),
                            },
                            {
                              onSuccess: () => {
                                navigate(backPath)
                              },
                            },
                          )
                        }
                      : undefined
                  }
                  onReject={
                    canClientReview
                      ? (note) => {
                          if (!clientReviewTicket) return
                          rejectBatchClips.mutate(
                            { videoTicketId: clientReviewTicket.id, note },
                            {
                              onSuccess: () => {
                                navigate(backPath)
                              },
                            },
                          )
                        }
                      : undefined
                  }
                />
              </div>
            </>
          )}

          {role === 'editor' && !hasStudioSource ? (
            <EditorBatchUploadPanel batch={batch} tickets={tickets} />
          ) : null}
        </div>
      </section>
    </div>
  )
}

export function ClipsWorkspacePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { batchId = '' } = useParams()
  const { clients, batches, videos, isWorkspaceLoading } = useRoleWorkspace()
  const role = roleFromUser(user)
  const batch = batches.find((item) => item.id === batchId)
  const batchTickets = videos.filter((ticket) => ticket.batchId === batchId)
  const hasStudioSource = batchTickets.some((ticket) =>
    Boolean(studioMediaSlot(ticket, 'source_clip')),
  )
  const backPath = role ? `/${role}/board` : '/'

  if (!role) return <Navigate to="/login" replace />
  if (isWorkspaceLoading && !batch) {
    return <p className="text-sm text-slate-500">Loading clips workspace…</p>
  }
  if (!batch || (!batch.clipsFolderUrl?.trim() && !hasStudioSource)) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => {
            navigate(backPath)
          }}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-950"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-transform group-hover:-translate-x-0.5">
            <ArrowLeft className="size-3.5" aria-hidden />
          </span>
          Back to workspace
        </button>
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-950">Clips are not available yet</p>
          <p className="mt-2 text-sm text-slate-500">
            The team is still finding clips for this batch. They will appear here when the numbered
            folder is ready.
          </p>
        </div>
      </div>
    )
  }

  const clientName =
    clients.find((client) => client.id === batch.clientId)?.displayName ?? 'Client'

  return (
    <ClipsWorkspaceContent
      key={batch.id}
      batch={batch}
      tickets={batchTickets}
      clientName={clientName}
      role={role}
      backPath={backPath}
    />
  )
}
