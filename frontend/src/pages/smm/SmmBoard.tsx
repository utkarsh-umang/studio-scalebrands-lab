import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMockAuth } from '@/auth'
import { NumberedClipsModal } from '@/components/path-b'
import { SmmAttentionStrip } from '@/components/smm/SmmAttentionStrip'
import { SmmBatchFolderRow } from '@/components/smm/SmmBatchFolderRow'
import { SmmClientRevisionModal } from '@/components/smm/SmmClientRevisionModal'
import { SmmFindClipsModal } from '@/components/smm/SmmFindClipsModal'
import { SmmPathBVideoKanban } from '@/components/smm/SmmPathBVideoKanban'
import { SmmProductionModal } from '@/components/smm/SmmProductionModal'
import { SmmScheduleVideoModal } from '@/components/smm/SmmScheduleVideoModal'
import { SmmVideoQaModal } from '@/components/smm/SmmVideoQaModal'
import {
  batchNeedsSmmFindClips,
  filterVideosForSmmKanban,
  listSmmAttention,
  smmBatchKanbanPhase,
  smmCanEditEditorDeliverable,
  smmNeedsAssetPrep,
  toSmmPathBVideoCard,
  videoNeedsSmmClientRevision,
  videoNeedsSmmQa,
  videoNeedsSmmSchedule,
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
  const [findClipsOpen, setFindClipsOpen] = useState(false)
  const [clipsViewOpen, setClipsViewOpen] = useState(false)
  const [scheduleVideoId, setScheduleVideoId] = useState<string | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [revisionThenProductionId, setRevisionThenProductionId] = useState<string | null>(
    null,
  )

  const effectiveBatchId = selectedBatchId ?? smmBatches[0]?.id ?? null
  const selectedBatch =
    smmBatches.find((b) => b.id === effectiveBatchId) ?? smmBatches[0]

  const batchVideos = useMemo(() => {
    if (!selectedBatch) return []
    const raw = getVideosForBatch(selectedBatch.id)
    return filterVideosForSmmKanban(selectedBatch, raw).map((t) =>
      toSmmPathBVideoCard(t, selectedBatch),
    )
  }, [selectedBatch, getVideosForBatch])

  const attention = useMemo(
    () => listSmmAttention(smmBatches, videos, clientNameById),
    [smmBatches, videos, clientNameById],
  )

  const activeCard = useMemo(
    () => batchVideos.find((v) => v.id === activeVideoId) ?? null,
    [batchVideos, activeVideoId],
  )

  const revisionProductionCard = useMemo(
    () => batchVideos.find((v) => v.id === revisionThenProductionId) ?? null,
    [batchVideos, revisionThenProductionId],
  )

  const scheduleCard = useMemo(
    () => batchVideos.find((v) => v.id === scheduleVideoId) ?? null,
    [batchVideos, scheduleVideoId],
  )

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

  const clientName = selectedBatch
    ? (clientNameById.get(selectedBatch.clientId) ?? 'Client')
    : 'Client'

  const phase = selectedBatch ? smmBatchKanbanPhase(selectedBatch) : null

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--heading)] text-foreground text-2xl font-bold tracking-tight md:text-3xl">
          Your board
        </h1>
        <p className="text-muted-foreground text-xs">
          {assignedClients.length} client
          {assignedClients.length === 1 ? '' : 's'} · Path B pipeline
        </p>
      </div>

      <SmmAttentionStrip
        items={attention}
        onOpen={(item) => {
          setSelectedBatchId(item.batchId)
          if (item.kind === 'find_clips') setFindClipsOpen(true)
          else if (item.kind === 'view_clips') setClipsViewOpen(true)
          else if (item.kind === 'schedule' && item.videoId) {
            setScheduleVideoId(item.videoId)
          } else if (item.videoId) setActiveVideoId(item.videoId)
        }}
      />

      <SmmBatchFolderRow
        batches={smmBatches}
        videos={videos.filter((v) => clientIds.has(v.clientId))}
        selectedBatchId={effectiveBatchId}
        onSelect={setSelectedBatchId}
      />

      {selectedBatch ? (
        <section className="mt-6 space-y-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
              Deliverables board
            </p>
            <p className="text-foreground text-sm font-semibold leading-snug">
              {selectedBatch.title}
              <span className="text-muted-foreground font-normal"> · {clientName}</span>
            </p>
          </div>

          {phase === 'identifying' ? (
            <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-8 text-center text-sm">
              Client shared raw footage — submit a numbered clips folder from the{' '}
              <strong className="text-foreground">Clip identification</strong> column.
            </p>
          ) : phase === 'pre_split' ? (
            <p className="text-muted-foreground border-border mb-2 rounded-xl border border-dashed px-4 py-4 text-center text-sm">
              Clips are on Drive; deliverables kanban appears after the editor links the
              videos + thumbnails folder.
            </p>
          ) : null}

          <SmmPathBVideoKanban
            batch={selectedBatch}
            videos={batchVideos}
            onFindClips={() => {
              setFindClipsOpen(true)
            }}
            onViewClips={() => {
              setClipsViewOpen(true)
            }}
            onOpenVideo={(videoId) => {
              const card = batchVideos.find((v) => v.id === videoId)
              if (!card || !selectedBatch) return
              if (videoNeedsSmmSchedule(card)) {
                setScheduleVideoId(videoId)
              } else {
                setActiveVideoId(videoId)
              }
            }}
          />
        </section>
      ) : (
        <p className="text-muted-foreground mt-6 text-sm">No active batches assigned to you yet.</p>
      )}

      {selectedBatch && batchNeedsSmmFindClips(selectedBatch) ? (
        <SmmFindClipsModal
          batch={selectedBatch}
          clientName={clientName}
          open={findClipsOpen}
          onClose={() => {
            setFindClipsOpen(false)
          }}
        />
      ) : null}

      {selectedBatch && clipsViewOpen && selectedBatch.clipsFolderUrl?.trim() ? (
        <NumberedClipsModal
          open
          batchId={selectedBatch.id}
          batchTitle={selectedBatch.title}
          clipsFolderUrl={selectedBatch.clipsFolderUrl}
          mode="view"
          resetKey={`${selectedBatch.id}-smm-clips`}
          onClose={() => {
            setClipsViewOpen(false)
          }}
        />
      ) : null}

      {selectedBatch && scheduleCard && videoNeedsSmmSchedule(scheduleCard) ? (
        <SmmScheduleVideoModal
          batch={selectedBatch}
          clientName={clientName}
          ticket={scheduleCard}
          open={scheduleVideoId === scheduleCard.id}
          onClose={() => {
            setScheduleVideoId(null)
          }}
        />
      ) : null}

      {activeCard && selectedBatch && videoNeedsSmmQa(activeCard) ? (
        <SmmVideoQaModal
          batch={selectedBatch}
          clientName={clientName}
          ticket={activeCard}
          open={activeVideoId === activeCard.id}
          onClose={() => {
            setActiveVideoId(null)
          }}
        />
      ) : null}

      {activeCard && selectedBatch && videoNeedsSmmClientRevision(activeCard) ? (
        <SmmClientRevisionModal
          batch={selectedBatch}
          clientName={clientName}
          ticket={activeCard}
          open={activeVideoId === activeCard.id}
          onClose={() => {
            setActiveVideoId(null)
          }}
          onOpenProduction={() => {
            setRevisionThenProductionId(activeCard.id)
          }}
        />
      ) : null}

      {(activeCard || revisionProductionCard) &&
      selectedBatch &&
      (smmNeedsAssetPrep(activeCard ?? revisionProductionCard!, selectedBatch) ||
        smmCanEditEditorDeliverable(
          activeCard ?? revisionProductionCard!,
          selectedBatch,
        )) ? (
        <SmmProductionModal
          batch={selectedBatch}
          clientName={clientName}
          ticket={activeCard ?? revisionProductionCard!}
          open={
            activeVideoId === (activeCard ?? revisionProductionCard)!.id ||
            revisionThenProductionId === (activeCard ?? revisionProductionCard)!.id
          }
          onClose={() => {
            setActiveVideoId(null)
            setRevisionThenProductionId(null)
          }}
        />
      ) : null}
    </>
  )
}
