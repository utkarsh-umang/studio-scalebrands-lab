import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMockAuth } from '@/auth'
import { EditorAttentionStrip } from '@/components/editor/EditorAttentionStrip'
import { EditorBatchFolderRow } from '@/components/editor/EditorBatchFolderRow'
import { EditorQaFixModal } from '@/components/editor/EditorQaFixModal'
import { EditorThumbnailsModal } from '@/components/editor/EditorThumbnailsModal'
import { EditorVideoKanban } from '@/components/editor/EditorVideoKanban'
import { EditorVideoTitleModal } from '@/components/editor/EditorVideoTitleModal'
import { EditorVideosDriveModal } from '@/components/editor/EditorVideosDriveModal'
import {
  batchAwaitingClips,
  batchReadyForEditorWork,
  filterVideosForEditorKanban,
  listEditorAttention,
  toEditorVideoCard,
  videoEditorQaReturn,
  videoNeedsEditorTitleSubmit,
  videoNeedsEditorThumbnailsSubmit,
} from '@/lib/editorBoard'
import { resolveEditorStaffId } from '@/lib/editorSession'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

export function EditorBoard() {
  const { user } = useMockAuth()
  const { clients, batches, videos, getVideosForBatch } = useAdminWorkspace()

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
  const [shareVideosBatchId, setShareVideosBatchId] = useState<string | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  const effectiveBatchId = selectedBatchId ?? editorBatches[0]?.id ?? null
  const selectedBatch =
    editorBatches.find((b) => b.id === effectiveBatchId) ?? editorBatches[0]

  const batchVideos = useMemo(() => {
    if (!selectedBatch) return []
    return filterVideosForEditorKanban(getVideosForBatch(selectedBatch.id)).map(
      toEditorVideoCard,
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

  const shareVideosBatch = shareVideosBatchId
    ? editorBatches.find((b) => b.id === shareVideosBatchId)
    : undefined

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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--heading)] text-foreground text-2xl font-bold tracking-tight md:text-3xl">
          Your board
        </h1>
        <p className="text-muted-foreground text-xs">
          {assignedClients.length} client
          {assignedClients.length === 1 ? '' : 's'} · deliverables workflow
        </p>
      </div>

      <EditorAttentionStrip
        items={attention}
        onOpen={(item) => {
          setSelectedBatchId(item.batchId)
          if (item.kind === 'share_videos_drive') {
            setShareVideosBatchId(item.batchId)
          }
          if (item.videoId) {
            setActiveVideoId(item.videoId)
          }
        }}
      />

      <EditorBatchFolderRow
        batches={editorBatches}
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
          {batchAwaitingClips(selectedBatch) ? (
            <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-8 text-center text-sm">
              Clips are still with the client or SMM. You will see deliverables
              columns here once clips are approved.
            </p>
          ) : batchReadyForEditorWork(selectedBatch) ? (
            <EditorVideoKanban
              batch={selectedBatch}
              clientName={clientNameById.get(selectedBatch.clientId) ?? 'Client'}
              videos={batchVideos}
              onOpenShareVideos={() => {
                setShareVideosBatchId(selectedBatch.id)
              }}
              onOpenVideo={setActiveVideoId}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              This batch is not ready for deliverables yet.
            </p>
          )}
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">
          No active batches assigned to you yet.
        </p>
      )}

      {shareVideosBatch && (
        <EditorVideosDriveModal
          batch={shareVideosBatch}
          clientName={clientNameById.get(shareVideosBatch.clientId) ?? 'Client'}
          open={shareVideosBatchId === shareVideosBatch.id}
          onClose={() => {
            setShareVideosBatchId(null)
          }}
        />
      )}

      {activeCard && selectedBatch && videoEditorQaReturn(activeCard) && (
        <EditorQaFixModal
          batch={selectedBatch}
          clientName={clientNameById.get(selectedBatch.clientId) ?? 'Client'}
          card={activeCard}
          open={activeVideoId === activeCard.id}
          onClose={() => {
            setActiveVideoId(null)
          }}
        />
      )}

      {activeCard &&
        selectedBatch &&
        videoNeedsEditorThumbnailsSubmit(activeCard) && (
          <EditorThumbnailsModal
            batch={selectedBatch}
            clientName={clientNameById.get(selectedBatch.clientId) ?? 'Client'}
            videoTitle={activeCard.title}
            open={activeVideoId === activeCard.id}
            onClose={() => {
              setActiveVideoId(null)
            }}
          />
        )}

      {activeCard && selectedBatch && videoNeedsEditorTitleSubmit(activeCard) && (
        <EditorVideoTitleModal
          batch={selectedBatch}
          clientName={clientNameById.get(selectedBatch.clientId) ?? 'Client'}
          card={activeCard}
          open={activeVideoId === activeCard.id}
          onClose={() => {
            setActiveVideoId(null)
          }}
        />
      )}
    </>
  )
}
