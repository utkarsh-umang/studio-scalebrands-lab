import { useEffect, useMemo, useState } from 'react'
import { useMockAuth } from '@/auth'
import { ClientAttentionStrip } from '@/components/client/ClientAttentionStrip'
import { ClientBatchFolderRow } from '@/components/client/ClientBatchFolderRow'
import { ClientCardDetailModal } from '@/components/client/ClientCardDetailModal'
import { ClientPageTitleRow } from '@/components/client/ClientPageTitleRow'
import { ClientBatchIntakeCard } from '@/components/client/ClientBatchIntakeCard'
import { ClientVideoKanban } from '@/components/client/ClientVideoKanban'
import {
  batchNeedsClientIntake,
  clientReservedCredits,
  filterVideosForClientKanban,
  listClientAttention,
  toClientVideoCard,
} from '@/lib/clientBoard'
import { resolveClientProfileId } from '@/lib/clientSession'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { Navigate, useSearchParams } from 'react-router-dom'

export function ClientBoard() {
  const { user } = useMockAuth()
  const { clients, batches, videos, getBatchesForClient, getVideosForBatch } =
    useAdminWorkspace()

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
    return filterVideosForClientKanban(selectedBatch, raw).map(toClientVideoCard)
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

  if (!client) {
    return (
      <p className="text-muted-foreground text-sm">
        Client account not linked to this login (prototype).
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
          <div className="space-y-2">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
              {selectedBatch.title} — videos
            </p>
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
    </>
  )
}
