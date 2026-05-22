import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMockAuth } from '@/auth'
import { EditorAttentionStrip } from '@/components/editor/EditorAttentionStrip'
import { EditorBatchFolderRow } from '@/components/editor/EditorBatchFolderRow'
import { EditorPathBVideoKanban } from '@/components/editor/EditorPathBVideoKanban'
import { EditorProductionModal } from '@/components/editor/EditorProductionModal'
import { EditorQaFixModal } from '@/components/editor/EditorQaFixModal'
import { FindClipsModal, NumberedClipsModal } from '@/components/path-b'
import {
  batchAwaitingClips,
  batchNeedsEditorFindClips,
  batchReadyForEditorWork,
  filterVideosForEditorKanban,
  listEditorAttention,
  toEditorPathBVideoCard,
  videoEditorQaReturn,
  editorNeedsProductionWork,
} from '@/lib/editorBoard'
import { resolveEditorStaffId } from '@/lib/editorSession'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

export function EditorBoard() {
  const { user } = useMockAuth()
  const { clients, batches, videos, getVideosForBatch, submitEditorVideosDrive } =
    useAdminWorkspace()

  const editorStaffId = resolveEditorStaffId(user)

  const assignedClients = useMemo(() => {
    if (!editorStaffId) return []
    return clients.filter(
      (c) => c.assignedEditorId === editorStaffId && c.accountStatus === 'active',
    )
  }, [clients, editorStaffId])

  const clientIds = useMemo(
    () => new Set(assignedClients.map((c) => c.id)),
    [assignedClients],
  )

  const clientNameById = useMemo(
    () => new Map(assignedClients.map((c) => [c.id, c.displayName])),
    [assignedClients],
  )

  const editorBatches = useMemo(() => {
    return batches
      .filter((b) => clientIds.has(b.clientId) && b.status === 'active')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [batches, clientIds])

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [findClipsOpen, setFindClipsOpen] = useState(false)
  const [clipsModalOpen, setClipsModalOpen] = useState(false)
  const [deliverablesDriveDraft, setDeliverablesDriveDraft] = useState('')
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  const effectiveBatchId = selectedBatchId ?? editorBatches[0]?.id ?? null
  const selectedBatch =
    editorBatches.find((b) => b.id === effectiveBatchId) ?? editorBatches[0]

  const batchVideos = useMemo(() => {
    if (!selectedBatch) return []
    const raw = getVideosForBatch(selectedBatch.id)
    return filterVideosForEditorKanban(selectedBatch, raw).map((t) =>
      toEditorPathBVideoCard(t, selectedBatch),
    )
  }, [selectedBatch, getVideosForBatch])

  const attention = useMemo(
    () => listEditorAttention(editorBatches, videos, clientNameById),
    [editorBatches, videos, clientNameById],
  )

  const activeCard = useMemo(
    () => batchVideos.find((v) => v.id === activeVideoId) ?? null,
    [batchVideos, activeVideoId],
  )

  if (!user || user.role !== 'employee' || user.employeeKind !== 'editor') {
    return <Navigate to="/login" replace />
  }

  if (!editorStaffId) {
    return (
      <p className="text-muted-foreground text-sm">
        Editor account not linked to workspace staff (prototype).
      </p>
    )
  }

  const clientName = selectedBatch
    ? (clientNameById.get(selectedBatch.clientId) ?? 'Client')
    : 'Client'

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--heading)] text-foreground text-2xl font-bold tracking-tight md:text-3xl">
          Your board
        </h1>
        <p className="text-muted-foreground text-xs">
          {assignedClients.length} client
          {assignedClients.length === 1 ? '' : 's'} · Path B deliverables
        </p>
      </div>

      <EditorAttentionStrip
        items={attention}
        onOpen={(item) => {
          setSelectedBatchId(item.batchId)
          if (item.kind === 'find_clips') {
            setFindClipsOpen(true)
          } else if (item.kind === 'pre_split_gate' || item.kind === 'submit_deliverables') {
            setClipsModalOpen(true)
          } else if (item.kind === 'qa_fix' && item.videoId) {
            setActiveVideoId(item.videoId)
          } else if (item.kind === 'production') {
            const batch = editorBatches.find((b) => b.id === item.batchId)
            if (!batch) return
            const work = filterVideosForEditorKanban(batch, videos.filter((v) => v.batchId === batch.id))
            const first = work.find(editorNeedsProductionWork)
            if (first) setActiveVideoId(first.id)
          }
        }}
      />

      <EditorBatchFolderRow
        batches={editorBatches}
        videos={videos.filter((v) => clientIds.has(v.clientId))}
        openBatchId={effectiveBatchId}
        onOpenBatch={(batchId) => {
          setSelectedBatchId(batchId)
        }}
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

          {batchNeedsEditorFindClips(selectedBatch) || batchReadyForEditorWork(selectedBatch) ? (
            <EditorPathBVideoKanban
              batch={selectedBatch}
              videos={batchVideos}
              onFindClips={() => {
                setFindClipsOpen(true)
              }}
              onOpenGate={() => {
                setDeliverablesDriveDraft(selectedBatch.editorDeliverablesDriveUrl ?? '')
                setClipsModalOpen(true)
              }}
              onOpenVideo={setActiveVideoId}
            />
          ) : batchAwaitingClips(selectedBatch) ? (
            <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-8 text-center text-sm">
              Waiting on client clip approval. Your deliverables kanban appears after clips are
              approved.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">This batch is not ready for deliverables yet.</p>
          )}
        </section>
      ) : (
        <p className="text-muted-foreground mt-6 text-sm">No active batches assigned to you yet.</p>
      )}

      {selectedBatch && batchNeedsEditorFindClips(selectedBatch) ? (
        <FindClipsModal
          batch={selectedBatch}
          clientName={clientName}
          role="editor"
          open={findClipsOpen}
          onClose={() => {
            setFindClipsOpen(false)
          }}
        />
      ) : null}

      {selectedBatch && clipsModalOpen && selectedBatch.clipsFolderUrl?.trim() ? (
        <NumberedClipsModal
          open
          batchId={selectedBatch.id}
          batchTitle={selectedBatch.title}
          clipsFolderUrl={selectedBatch.clipsFolderUrl}
          mode="editor"
          resetKey={`${selectedBatch.id}-clips`}
          deliverablesDriveUrl={deliverablesDriveDraft}
          onDeliverablesDriveUrlChange={setDeliverablesDriveDraft}
          onSubmitDeliverables={() => {
            submitEditorVideosDrive(selectedBatch.id, deliverablesDriveDraft)
            setClipsModalOpen(false)
          }}
          submitDeliverablesDisabled={!deliverablesDriveDraft.trim()}
          onClose={() => {
            setClipsModalOpen(false)
          }}
        />
      ) : null}

      {activeCard && selectedBatch && videoEditorQaReturn(activeCard) ? (
        <EditorQaFixModal
          batch={selectedBatch}
          clientName={clientName}
          card={activeCard}
          open={activeVideoId === activeCard.id}
          onClose={() => {
            setActiveVideoId(null)
          }}
        />
      ) : null}

      {activeCard &&
      selectedBatch &&
      editorNeedsProductionWork(activeCard) &&
      !videoEditorQaReturn(activeCard) ? (
        <EditorProductionModal
          batch={selectedBatch}
          clientName={clientName}
          ticket={activeCard}
          open={activeVideoId === activeCard.id}
          onClose={() => {
            setActiveVideoId(null)
          }}
        />
      ) : null}
    </>
  )
}
