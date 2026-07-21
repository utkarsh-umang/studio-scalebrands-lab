import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/auth'
import { ClientAttentionStrip } from '@/components/client/ClientAttentionStrip'
import { History } from 'lucide-react'
import { BatchActivityModal } from '@/components/BatchActivityModal'
import { ClientBatchFolderRow } from '@/components/client/ClientBatchFolderRow'
import { ClientIdeaPanel } from '@/components/client/ClientIdeaPanel'
import { ClientCardDetailModal } from '@/components/client/ClientCardDetailModal'
import { ClientPageTitleRow } from '@/components/client/ClientPageTitleRow'
import { ClientBatchIntakeCard } from '@/components/client/ClientBatchIntakeCard'
import { ClientThumbnailsFolderCard } from '@/components/client/ClientThumbnailsFolderCard'
import { ClientVideoKanban } from '@/components/client/ClientVideoKanban'
import {
  batchNeedsClientIntake,
  clientReservedCredits,
  filterVideosForClientKanban,
  listClientAttention,
  toClientVideoCard,
} from '@/lib/clientBoard'
import { resolveClientProfileId } from '@/lib/clientSession'
import { useRoleWorkspace } from '@/hooks/api/workspace/useRoleWorkspace'
import { Navigate, useSearchParams } from 'react-router-dom'

export function ClientBoard() {
  const { user } = useAuth()
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

  useEffect(() => {
    const openId = searchParams.get('openVideo')
    if (!openId || !clientProfileId) return
    const clientBatchIds = new Set(
      batches.filter((b) => b.clientId === clientProfileId).map((b) => b.id),
    )
    const target = videos.find((v) => v.id === openId && clientBatchIds.has(v.batchId))
    if (!target) return
    setSelectedBatchId(target.batchId)
    setOpenVideoId(openId)
    const next = new URLSearchParams(searchParams)
    next.delete('openVideo')
    setSearchParams(next, { replace: true })
  }, [clientProfileId, batches, videos, searchParams, setSearchParams])

  const effectiveBatchId =
    selectedBatchId ?? clientBatches[0]?.id ?? null
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

  const attention = useMemo(() => {
    if (!clientProfileId) return []
    const clientBatchIds = new Set(
      batches.filter((b) => b.clientId === clientProfileId).map((b) => b.id),
    )
    const clientVideos = videos.filter((v) => clientBatchIds.has(v.batchId))
    const clientBatchList = batches.filter((b) => b.clientId === clientProfileId)
    return listClientAttention(clientBatchList, clientVideos)
  }, [clientProfileId, batches, videos])

  const openCard = useMemo(
    () => batchVideos.find((v) => v.id === openVideoId) ?? null,
    [batchVideos, openVideoId],
  )

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
        title="Your board"
        credits={client.credits}
        reservedCredits={reservedCredits}
      />

      <ClientAttentionStrip
        items={attention}
        onOpen={(videoId) => {
          const video = videos.find((v) => v.id === videoId)
          if (video) {
            setSelectedBatchId(video.batchId)
            setOpenVideoId(videoId)
          }
        }}
      />

      <ClientBatchFolderRow
        batches={clientBatches}
        selectedBatchId={effectiveBatchId}
        onSelect={setSelectedBatchId}
      />

      {selectedBatch ? (
        <section className="space-y-4">
          {batchNeedsClientIntake(selectedBatch) && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
                Start this batch — we need your link
              </p>
              <ClientBatchIntakeCard batch={selectedBatch} />
            </div>
          )}
          {selectedBatch.thumbnailOwnerKind === 'client' && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
                Thumbnails — yours to send
              </p>
              <ClientThumbnailsFolderCard batch={selectedBatch} />
            </div>
          )}
          {['idea_research', 'idea_review', 'idea_footage_pending'].includes(
            selectedBatch.pipelineStage ?? '',
          ) ? (
            <ClientIdeaPanel batch={selectedBatch} />
          ) : null}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
                {selectedBatch.title} — videos
              </p>
              <button
                type="button"
                onClick={() => {
                  setActivityOpen(true)
                }}
                className="text-muted-foreground hover:text-foreground border-border hover:border-primary/35 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
              >
                <History className="size-3.5" aria-hidden />
                Activity
              </button>
            </div>
            <ClientVideoKanban
              batch={selectedBatch}
              videos={batchVideos}
              onOpenVideo={setOpenVideoId}
            />
          </div>
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">
          When your admin creates a batch folder, it will appear above.
        </p>
      )}

      <ClientCardDetailModal
        card={openCard}
        batchId={selectedBatch?.id ?? ''}
        batchTitle={selectedBatch?.title ?? ''}
        onClose={() => {
          setOpenVideoId(null)
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
    </>
  )
}
