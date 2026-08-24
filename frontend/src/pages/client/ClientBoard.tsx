import { useMemo, useState } from 'react'
import { useAuth } from '@/auth'
import { ArrowRight, History } from 'lucide-react'
import { BatchActivityModal } from '@/components/BatchActivityModal'
import { ClientBatchFolderRow } from '@/components/client/ClientBatchFolderRow'
import { ClientBatchProgress } from '@/components/client/ClientBatchProgress'
import { ClientIdeaPanel } from '@/components/client/ClientIdeaPanel'
import { ClientCardDetailModal } from '@/components/client/ClientCardDetailModal'
import { ClientPageTitleRow } from '@/components/client/ClientPageTitleRow'
import { ClientBatchIntakeCard } from '@/components/client/ClientBatchIntakeCard'
import { ClientProductionOverview } from '@/components/client/ClientProductionOverview'
import { ClientAddVideosModal } from '@/components/client/ClientAddVideosModal'
import { ClientThumbnailUploadModal } from '@/components/client/ClientThumbnailUploadModal'
import { ClientVideoKanban } from '@/components/client/ClientVideoKanban'
import {
  batchNeedsClientIntake,
  clientReservedCredits,
  filterVideosForClientKanban,
  toClientVideoCard,
} from '@/lib/clientBoard'
import { resolveClientProfileId } from '@/lib/clientSession'
import { useRoleWorkspace } from '@/hooks/api/workspace/useRoleWorkspace'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

export function ClientBoard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    clients,
    batches,
    videos,
    getBatchesForClient,
    getVideosForBatch,
    isWorkspaceLoading,
  } = useRoleWorkspace()

  const clientProfileId = resolveClientProfileId(user)
  const client = clientProfileId
    ? clients.find((c) => c.id === clientProfileId)
    : undefined

  const clientBatches = useMemo(() => {
    if (!clientProfileId) return []
    return getBatchesForClient(clientProfileId).filter((b) => b.status === 'active')
  }, [clientProfileId, getBatchesForClient])

  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [openVideoId, setOpenVideoId] = useState<string | null>(null)
  const [activityOpen, setActivityOpen] = useState(false)
  const [addVideosOpen, setAddVideosOpen] = useState(false)
  const [thumbnailVideoId, setThumbnailVideoId] = useState<string | null>(null)

  const requestedVideo = useMemo(() => {
    const requestedVideoId = searchParams.get('openVideo')
    if (!requestedVideoId || !clientProfileId) return null
    const clientBatchIds = new Set(
      batches.filter((b) => b.clientId === clientProfileId).map((b) => b.id),
    )
    return (
      videos.find(
        (video) =>
          video.id === requestedVideoId && clientBatchIds.has(video.batchId),
      ) ?? null
    )
  }, [clientProfileId, batches, videos, searchParams])

  const effectiveBatchId =
    requestedVideo?.batchId ?? selectedBatchId ?? clientBatches[0]?.id ?? null
  const selectedBatch =
    clientBatches.find((b) => b.id === effectiveBatchId) ?? clientBatches[0]

  const batchVideos = useMemo(() => {
    if (!selectedBatch) return []
    const raw = getVideosForBatch(selectedBatch.id)
    return filterVideosForClientKanban(selectedBatch, raw).map((v) =>
      toClientVideoCard(v, selectedBatch),
    )
  }, [selectedBatch, getVideosForBatch])

  const reservedCredits = useMemo(
    () => clientReservedCredits(clientBatches),
    [clientBatches],
  )

  const openCard = useMemo(
    () =>
      batchVideos.find(
        (video) => video.id === (requestedVideo?.id ?? openVideoId),
      ) ?? null,
    [batchVideos, openVideoId, requestedVideo],
  )
  const selectedBatchNeedsIntake = selectedBatch
    ? batchNeedsClientIntake(selectedBatch)
    : false
  const indexedBatchVideos = batchVideos.filter(
    (video) => video.deliverableIndex != null && video.deliverableIndex > 0,
  )

  function handleOpenVideo(videoId: string) {
    if (!selectedBatch) return
    const card = batchVideos.find((video) => video.id === videoId)
    if (
      card?.reviewKind === 'clip' ||
      card?.clientGateKind === 'clip_identification' ||
      card?.clientGateKind === 'clips_in_production' ||
      (selectedBatch.clipReviewPhase === 'approved' &&
        !selectedBatch.editorDeliverablesDriveUrl?.trim() &&
        card?.owner === 'editor')
    ) {
      navigate(`/client/batches/${selectedBatch.id}/clips`)
    } else if (card?.reviewKind === 'final') {
      navigate(`/client/review/${videoId}`)
    } else {
      setOpenVideoId(videoId)
    }
  }

  if (!user || user.role !== 'client') {
    return <Navigate to="/login" replace />
  }

  if (isWorkspaceLoading && !client) {
    return <p className="text-muted-foreground text-sm">Loading your board…</p>
  }

  if (!client) {
    return (
      <p className="text-muted-foreground text-sm">
        Client account not linked to this login.
      </p>
    )
  }

  return (
    <>
      <ClientPageTitleRow
        eyebrow="Client workspace"
        title={`Welcome back, ${user.name}`}
        credits={client.credits}
        reservedCredits={reservedCredits}
      />

      <ClientBatchFolderRow
        batches={clientBatches}
        selectedBatchId={effectiveBatchId}
        onSelect={setSelectedBatchId}
      />

      {selectedBatch ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 md:px-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                  Selected batch
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Batch {selectedBatch.batchNumber}
                </span>
                <span
                  className={[
                    'rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em]',
                    selectedBatchNeedsIntake
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700',
                  ].join(' ')}
                >
                  {selectedBatchNeedsIntake ? 'Kickoff needed' : 'In progress'}
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-slate-950 md:text-xl">
                {selectedBatch.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setActivityOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:text-blue-700"
            >
              <History className="size-3.5" aria-hidden />
              Activity
            </button>
          </header>

          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 md:px-6">
            <ClientBatchProgress batch={selectedBatch} />
          </div>

          <div className="space-y-4 p-4 md:p-5">
            {selectedBatchNeedsIntake ? (
              <ClientBatchIntakeCard batch={selectedBatch} />
            ) : (
              <>
                {['idea_research', 'idea_review', 'idea_footage_pending'].includes(
                  selectedBatch.pipelineStage ?? '',
                ) ? (
                  <ClientIdeaPanel batch={selectedBatch} />
                ) : null}
                {indexedBatchVideos.length > 0 ? (
                  <ClientProductionOverview
                    batch={selectedBatch}
                    videos={indexedBatchVideos}
                    onOpenVideo={handleOpenVideo}
                    onOpenClips={
                      () => {
                        navigate(`/client/batches/${selectedBatch.id}/clips`)
                      }
                    }
                    onAddVideos={() => setAddVideosOpen(true)}
                    onAddThumbnail={setThumbnailVideoId}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          Deliverables
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Open any video to see its assets, feedback, and review state.
                        </p>
                      </div>
                      <span className="hidden items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-600 sm:inline-flex">
                        Track each video
                        <ArrowRight className="size-3" aria-hidden />
                      </span>
                    </div>
                    <ClientVideoKanban
                      batch={selectedBatch}
                      videos={batchVideos}
                      onOpenVideo={handleOpenVideo}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-900">No active batches yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Your next batch will appear here as soon as your account manager creates it.
          </p>
        </div>
      )}

      <ClientCardDetailModal
        card={openCard}
        batchId={selectedBatch?.id ?? ''}
        batchTitle={selectedBatch?.title ?? ''}
        onClose={() => {
          setOpenVideoId(null)
          if (searchParams.has('openVideo')) {
            const next = new URLSearchParams(searchParams)
            next.delete('openVideo')
            setSearchParams(next, { replace: true })
          }
        }}
      />

      <BatchActivityModal
        batchId={activityOpen ? (selectedBatch?.id ?? null) : null}
        batchTitle={selectedBatch?.title}
        open={activityOpen}
        onClose={() => {
          setActivityOpen(false)
        }}
      />

      {selectedBatch ? (
        <ClientAddVideosModal
          batch={selectedBatch}
          open={addVideosOpen}
          onClose={() => setAddVideosOpen(false)}
        />
      ) : null}

      <ClientThumbnailUploadModal
        ticket={videos.find((video) => video.id === thumbnailVideoId) ?? null}
        onClose={() => setThumbnailVideoId(null)}
      />
    </>
  )
}
