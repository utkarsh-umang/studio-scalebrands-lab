import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMockAuth } from '@/auth'
import { SmmAttentionStrip } from '@/components/smm/SmmAttentionStrip'
import { SmmBatchFolderRow } from '@/components/smm/SmmBatchFolderRow'
import { SmmFindClipsModal } from '@/components/smm/SmmFindClipsModal'
import { SmmScheduleBatchModal } from '@/components/smm/SmmScheduleBatchModal'
import { SmmVideoKanban } from '@/components/smm/SmmVideoKanban'
import { SmmVideoQaModal } from '@/components/smm/SmmVideoQaModal'
import {
  listSmmBatchAttention,
  toSmmVideoCard,
} from '@/lib/smmBoard'
import { resolveSmmStaffId } from '@/lib/smmSession'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

export function SmmBoard() {
  const { user } = useMockAuth()
  const { clients, batches, videos, getVideosForBatch } = useAdminWorkspace()

  const smmStaffId = resolveSmmStaffId(user)

  const assignedClients = useMemo(() => {
    if (!smmStaffId) return []
    return clients.filter(
      (c) => c.assignedSmmId === smmStaffId && c.accountStatus === 'active',
    )
  }, [clients, smmStaffId])

  const clientIds = useMemo(
    () => new Set(assignedClients.map((c) => c.id)),
    [assignedClients],
  )

  const clientNameById = useMemo(
    () => new Map(assignedClients.map((c) => [c.id, c.displayName])),
    [assignedClients],
  )

  const smmBatches = useMemo(() => {
    return batches
      .filter((b) => clientIds.has(b.clientId) && b.status === 'active')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [batches, clientIds])

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [findClipsBatchId, setFindClipsBatchId] = useState<string | null>(null)
  const [scheduleBatchId, setScheduleBatchId] = useState<string | null>(null)
  const [qaVideoId, setQaVideoId] = useState<string | null>(null)

  const effectiveBatchId = selectedBatchId ?? smmBatches[0]?.id ?? null
  const selectedBatch =
    smmBatches.find((b) => b.id === effectiveBatchId) ?? smmBatches[0]

  const batchVideos = useMemo(() => {
    if (!selectedBatch) return []
    return getVideosForBatch(selectedBatch.id).map(toSmmVideoCard)
  }, [selectedBatch, getVideosForBatch])

  const attention = useMemo(
    () => listSmmBatchAttention(smmBatches, videos, clientNameById),
    [smmBatches, videos, clientNameById],
  )

  const findClipsBatch = findClipsBatchId
    ? smmBatches.find((b) => b.id === findClipsBatchId)
    : undefined
  const scheduleBatch = scheduleBatchId
    ? smmBatches.find((b) => b.id === scheduleBatchId)
    : undefined

  const qaCard = useMemo(() => {
    if (!qaVideoId) return null
    const ticket = videos.find((v) => v.id === qaVideoId)
    return ticket ? toSmmVideoCard(ticket) : null
  }, [qaVideoId, videos])

  const qaBatch = useMemo(() => {
    if (!qaCard) return selectedBatch
    return smmBatches.find((b) => b.id === qaCard.batchId) ?? selectedBatch
  }, [qaCard, smmBatches, selectedBatch])

  if (!user || user.role !== 'employee' || user.employeeKind !== 'smm') {
    return <Navigate to="/login" replace />
  }

  if (!smmStaffId) {
    return (
      <p className="text-muted-foreground text-sm">
        SMM account not linked to workspace staff (prototype).
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--heading)] text-foreground text-2xl font-bold tracking-tight md:text-3xl">
          Your board
        </h1>
        <p className="text-muted-foreground text-xs">
          {assignedClients.length} client
          {assignedClients.length === 1 ? '' : 's'} · raw footage path
        </p>
      </div>

      <SmmAttentionStrip
        items={attention}
        onOpen={(item) => {
          setSelectedBatchId(item.batchId)
          if (item.kind === 'find_clips') setFindClipsBatchId(item.batchId)
          if (item.kind === 'schedule') setScheduleBatchId(item.batchId)
          if (item.kind === 'video_qa' && item.videoId) {
            setQaVideoId(item.videoId)
          }
        }}
      />

      <SmmBatchFolderRow
        batches={smmBatches}
        videos={videos.filter((v) => clientIds.has(v.clientId))}
        selectedBatchId={effectiveBatchId}
        onSelect={setSelectedBatchId}
      />

      {selectedBatch ? (
        <section className="space-y-2">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
            {selectedBatch.title} —{' '}
            {clientNameById.get(selectedBatch.clientId) ?? 'Client'}
          </p>
          <SmmVideoKanban
            batch={selectedBatch}
            clientName={clientNameById.get(selectedBatch.clientId) ?? 'Client'}
            videos={batchVideos}
            onOpenFindClips={() => {
              setFindClipsBatchId(selectedBatch.id)
            }}
            onOpenSchedule={() => {
              setScheduleBatchId(selectedBatch.id)
            }}
            onOpenVideoQa={(videoId) => {
              setQaVideoId(videoId)
            }}
          />
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">
          No active batches on your accounts yet.
        </p>
      )}

      {findClipsBatch && (
        <SmmFindClipsModal
          batch={findClipsBatch}
          clientName={clientNameById.get(findClipsBatch.clientId) ?? 'Client'}
          open={findClipsBatchId === findClipsBatch.id}
          onClose={() => {
            setFindClipsBatchId(null)
          }}
        />
      )}

      {scheduleBatch && (
        <SmmScheduleBatchModal
          batch={scheduleBatch}
          clientName={clientNameById.get(scheduleBatch.clientId) ?? 'Client'}
          videos={getVideosForBatch(scheduleBatch.id)}
          open={scheduleBatchId === scheduleBatch.id}
          onClose={() => {
            setScheduleBatchId(null)
          }}
        />
      )}

      {qaCard && qaBatch && (
        <SmmVideoQaModal
          card={qaCard}
          batchId={qaBatch.id}
          batchTitle={qaBatch.title}
          clientName={clientNameById.get(qaBatch.clientId) ?? 'Client'}
          deliverablesFolderUrl={qaBatch.editorDeliverablesDriveUrl}
          open={qaVideoId === qaCard.id}
          onClose={() => {
            setQaVideoId(null)
          }}
        />
      )}
    </>
  )
}
