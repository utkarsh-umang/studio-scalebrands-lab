import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMockAuth } from '@/auth'
import { SmmAttentionStrip } from '@/components/smm/SmmAttentionStrip'
import { SmmBatchBoard } from '@/components/smm/SmmBatchBoard'
import { SmmBatchDetailModal } from '@/components/smm/SmmBatchDetailModal'
import { SmmBatchFolderRow } from '@/components/smm/SmmBatchFolderRow'
import {
  batchAppearsOnSmmPipelineBoard,
  listSmmBatchAttention,
} from '@/lib/smmBoard'
import { resolveSmmStaffId } from '@/lib/smmSession'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

export function SmmBoard() {
  const { user } = useMockAuth()
  const { clients, batches, videos } = useAdminWorkspace()

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

  const pipelineBatches = useMemo(() => {
    const vids = videos.filter((v) => clientIds.has(v.clientId))
    return smmBatches.filter((b) => batchAppearsOnSmmPipelineBoard(b, vids))
  }, [smmBatches, videos, clientIds])

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null)

  const effectiveBatchId = selectedBatchId ?? pipelineBatches[0]?.id ?? null

  const attention = useMemo(
    () => listSmmBatchAttention(smmBatches, videos, clientNameById),
    [smmBatches, videos, clientNameById],
  )

  const detailBatch = useMemo(() => {
    if (!detailBatchId) return null
    return smmBatches.find((b) => b.id === detailBatchId) ?? null
  }, [detailBatchId, smmBatches])

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
          One card per batch · open a batch for deliverables on the right
        </p>
      </div>

      <SmmAttentionStrip
        items={attention}
        onOpen={(item) => {
          setSelectedBatchId(item.batchId)
          setDetailBatchId(item.batchId)
        }}
      />

      <SmmBatchFolderRow
        batches={pipelineBatches}
        videos={videos.filter((v) => clientIds.has(v.clientId))}
        selectedBatchId={effectiveBatchId}
        onSelect={(id) => {
          setSelectedBatchId(id)
          setDetailBatchId(id)
        }}
      />

      {smmBatches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No active batches on your accounts yet.
        </p>
      ) : pipelineBatches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing in the three-column pipeline. If a batch is fully posted, close it from{' '}
          <strong className="text-foreground">Completed</strong> in the sidebar.
        </p>
      ) : (
        <section className="space-y-2">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
            Pipeline
          </p>
          <SmmBatchBoard
            batches={pipelineBatches}
            videos={videos.filter((v) => clientIds.has(v.clientId))}
            clientNameById={clientNameById}
            onOpenBatch={(batchId) => {
              setSelectedBatchId(batchId)
              setDetailBatchId(batchId)
            }}
          />
        </section>
      )}

      <SmmBatchDetailModal
        batch={detailBatch}
        clientName={
          detailBatch
            ? clientNameById.get(detailBatch.clientId) ?? 'Client'
            : ''
        }
        allVideos={videos}
        open={detailBatchId !== null && detailBatch !== null}
        onClose={() => {
          setDetailBatchId(null)
        }}
      />
    </>
  )
}
