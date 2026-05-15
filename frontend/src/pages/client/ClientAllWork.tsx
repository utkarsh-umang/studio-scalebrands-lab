import { useMemo } from 'react'
import { Calendar, Clock, Folder } from 'lucide-react'
import { useMockAuth } from '@/auth'
import { ClientPageTitleRow } from '@/components/client/ClientPageTitleRow'
import {
  CLIENT_BOARD_COLUMNS,
  toClientVideoCard,
} from '@/lib/clientBoard'
import { resolveClientProfileId } from '@/lib/clientSession'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { formatDate } from './clientPageUtils'
import { Navigate } from 'react-router-dom'

export function ClientAllWork() {
  const { user } = useMockAuth()
  const { clients, videos, getBatchesForClient, getVideosForBatch } =
    useAdminWorkspace()

  const clientProfileId = resolveClientProfileId(user)
  const client = clientProfileId
    ? clients.find((c) => c.id === clientProfileId)
    : undefined

  const allBatches = useMemo(() => {
    if (!clientProfileId) return []
    return getBatchesForClient(clientProfileId)
  }, [clientProfileId, getBatchesForClient])

  const scheduledVideos = useMemo(() => {
    if (!clientProfileId) return []
    return videos
      .filter((v) => v.clientId === clientProfileId)
      .map(toClientVideoCard)
      .filter((v) => v.clientColumn === 'completed')
  }, [clientProfileId, videos])

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
      <ClientPageTitleRow title="All work" credits={client.credits} />

      <section className="space-y-4">
        <h2 className="text-foreground text-sm font-semibold">Batch folders</h2>
        {allBatches.length === 0 ? (
          <p className="text-muted-foreground text-sm">No batches yet.</p>
        ) : (
          <ul className="space-y-4">
            {allBatches.map((batch) => {
              const batchCards = getVideosForBatch(batch.id).map(toClientVideoCard)
              const byColumn = CLIENT_BOARD_COLUMNS.map((col) => ({
                ...col,
                items: batchCards.filter((c) => c.clientColumn === col.id),
              }))
              return (
                <li
                  key={batch.id}
                  className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
                  style={{
                    boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
                  }}
                >
                  <div className="border-border flex flex-wrap items-center gap-2 border-b px-5 py-3">
                    <Folder className="text-muted-foreground size-4" aria-hidden />
                    <span className="text-foreground font-medium">{batch.title}</span>
                    <span className="text-muted-foreground text-xs">
                      Batch {batch.batchNumber} · {batch.status === 'completed' ? 'Completed' : 'Active'} · Updated{' '}
                      {formatDate(batch.updatedAt)}
                    </span>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {byColumn.map((col) => (
                      <div key={col.id}>
                        <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase tracking-wide">
                          {col.label} ({col.items.length})
                        </p>
                        {col.items.length === 0 ? (
                          <p className="text-muted-foreground text-xs">—</p>
                        ) : (
                          <ul className="space-y-1">
                            {col.items.map((v) => (
                              <li
                                key={v.id}
                                className="text-foreground text-xs leading-snug"
                              >
                                {v.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  {batch.footageUrl && (
                    <p className="text-muted-foreground border-border border-t px-5 py-2 text-[11px]">
                      Footage:{' '}
                      <a
                        href={batch.footageUrl}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {batch.footageUrl}
                      </a>
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-foreground size-5" aria-hidden />
          <h2 className="text-foreground text-base font-semibold">Scheduled</h2>
        </div>
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          {scheduledVideos.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">
              No completed videos yet — approved work appears here after scheduling.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {scheduledVideos.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-foreground font-medium">{row.title}</p>
                    <p className="text-muted-foreground text-xs">{row.stageLabel}</p>
                  </div>
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <Clock className="size-3.5" aria-hidden />
                    Completed
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
