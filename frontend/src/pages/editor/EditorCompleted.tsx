import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useMockAuth } from '@/auth'
import { EditorBatchFolderRow } from '@/components/editor/EditorBatchFolderRow'
import { resolveEditorStaffId } from '@/lib/editorSession'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { formatDate } from '@/pages/client/clientPageUtils'

export function EditorCompleted() {
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

  const completedBatches = useMemo(() => {
    return batches
      .filter((b) => clientIds.has(b.clientId) && b.status === 'completed')
      .sort((a, b) =>
        (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt),
      )
  }, [batches, clientIds])

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)

  const effectiveBatchId = selectedBatchId ?? completedBatches[0]?.id ?? null
  const selectedBatch =
    completedBatches.find((b) => b.id === effectiveBatchId) ?? completedBatches[0]

  const batchTickets = useMemo(() => {
    if (!selectedBatch) return []
    return getVideosForBatch(selectedBatch.id).sort(
      (a, b) => (a.deliverableIndex ?? 999) - (b.deliverableIndex ?? 999),
    )
  }, [selectedBatch, getVideosForBatch])

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
          Completed batches
        </h1>
        <p className="text-muted-foreground text-xs">
          {completedBatches.length} batch
          {completedBatches.length === 1 ? '' : 'es'}
        </p>
      </div>

      <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
        Read-only archive of batches that finished scheduling and closed. Same layout as the SMM
        completed view.
      </p>

      {completedBatches.length > 0 ? (
        <EditorBatchFolderRow
          batches={completedBatches}
          videos={videos.filter((v) => clientIds.has(v.clientId))}
          openBatchId={effectiveBatchId}
          onOpenBatch={(id) => {
            setSelectedBatchId(id)
          }}
        />
      ) : null}

      {selectedBatch ? (
        <section className="border-border bg-background/85 space-y-5 rounded-2xl border p-5 md:p-6">
          <header>
            <h2 className="text-foreground text-lg font-semibold">{selectedBatch.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {clientNameById.get(selectedBatch.clientId) ?? 'Client'} · Batch{' '}
              {selectedBatch.batchNumber}
              {selectedBatch.completedAt
                ? ` · Closed ${formatDate(selectedBatch.completedAt)}`
                : ''}
            </p>
          </header>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                Credit cost
              </dt>
              <dd className="text-foreground mt-0.5 font-medium">{selectedBatch.creditCost}</dd>
            </div>
            {selectedBatch.batchSchedule ? (
              <>
                <div>
                  <dt className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                    Attested channels
                  </dt>
                  <dd className="text-foreground mt-0.5 font-medium">
                    {selectedBatch.batchSchedule.platform}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                    Go-live snapshot
                  </dt>
                  <dd className="text-foreground mt-0.5 text-xs">
                    {selectedBatch.batchSchedule.goLiveAt}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>

          {selectedBatch.clipsFolderUrl ? (
            <a
              href={selectedBatch.clipsFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Clips folder (historical)
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
          {selectedBatch.editorDeliverablesDriveUrl ? (
            <a
              href={selectedBatch.editorDeliverablesDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Editor deliverables (historical)
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}

          <div>
            <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
              Deliverables
            </p>
            <ul className="space-y-2">
              {batchTickets.length === 0 ? (
                <li className="text-muted-foreground text-sm">No ticket rows in seed data.</li>
              ) : (
                batchTickets.map((t) => (
                  <li
                    key={t.id}
                    className="text-foreground border-border rounded-lg border px-3 py-2 text-sm"
                  >
                    {t.deliverableIndex != null ? `Video ${t.deliverableIndex}` : 'Gate'} —{' '}
                    {t.title}
                    <span className="text-muted-foreground block text-xs">{t.stageLabel}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      ) : (
        <section className="border-border bg-background/85 rounded-2xl border p-8 text-center">
          <p className="text-foreground text-sm font-medium">No completed batches yet</p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            When your SMM closes batches after scheduling, they appear here for reference.
          </p>
        </section>
      )}
    </>
  )
}
