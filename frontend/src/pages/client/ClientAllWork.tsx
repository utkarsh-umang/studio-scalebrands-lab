import { useMemo } from 'react'
import { Calendar, CheckCircle2, Clock, Folder } from 'lucide-react'
import { useMockAuth } from '@/auth'
import { ClientPageTitleRow } from '@/components/client/ClientPageTitleRow'
import { clientReservedCredits, toClientVideoCard } from '@/lib/clientBoard'
import { resolveClientProfileId } from '@/lib/clientSession'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { formatDate } from './clientPageUtils'
import { Navigate, Link } from 'react-router-dom'

export function ClientAllWork() {
  const { user } = useMockAuth()
  const { clients, videos, batches, getBatchesForClient, getVideosForBatch } =
    useAdminWorkspace()

  const clientProfileId = resolveClientProfileId(user)
  const client = clientProfileId
    ? clients.find((c) => c.id === clientProfileId)
    : undefined

  const allBatches = useMemo(() => {
    if (!clientProfileId) return []
    return getBatchesForClient(clientProfileId)
  }, [clientProfileId, getBatchesForClient])

  const activeBatches = useMemo(
    () => allBatches.filter((b) => b.status === 'active'),
    [allBatches],
  )

  const completedBatches = useMemo(
    () => allBatches.filter((b) => b.status === 'completed'),
    [allBatches],
  )

  const scheduledVideos = useMemo(() => {
    if (!clientProfileId) return []
    return videos
      .filter((v) => v.clientId === clientProfileId)
      .map(toClientVideoCard)
      .filter((v) => v.owner === 'done' || v.clientColumn === 'completed')
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [clientProfileId, videos])

  const reservedCredits = useMemo(
    () => clientReservedCredits(activeBatches),
    [activeBatches],
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
        title="Our work"
        credits={client.credits}
        reservedCredits={reservedCredits}
      />

      <p className="text-muted-foreground -mt-4 text-sm leading-relaxed">
        Scheduled and completed videos across all batch folders. Active work lives on{' '}
        <Link to="/client/board" className="text-primary font-medium hover:underline">
          your board
        </Link>
        .
      </p>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-foreground size-5" aria-hidden />
          <h2 className="text-foreground text-base font-semibold">Scheduled & completed</h2>
        </div>
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          {scheduledVideos.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">
              No scheduled videos yet — after you approve final QA and SMM schedules every clip in a
              batch, completed items appear here.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {scheduledVideos.map((row) => {
                const batch = batches.find((b) => b.id === row.batchId)
                const publishLink = batch?.batchSchedule?.videoPublishLinks?.[row.id]
                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-foreground font-medium">
                        {row.editorPublishTitle?.trim() || row.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {batch?.title ?? 'Batch'} · {row.stageLabel}
                        {row.deliverableIndex != null ? ` · #${row.deliverableIndex}` : null}
                      </p>
                      {publishLink ? (
                        <a
                          href={publishLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary mt-1 inline-block text-xs font-medium hover:underline"
                        >
                          View publish link
                        </a>
                      ) : null}
                    </div>
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <CheckCircle2 className="size-3.5 text-[var(--success)]" aria-hidden />
                      Scheduled
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-foreground text-sm font-semibold">Completed batches</h2>
        {completedBatches.length === 0 ? (
          <p className="text-muted-foreground text-sm">No completed batch cycles yet.</p>
        ) : (
          <ul className="space-y-3">
            {completedBatches.map((batch) => {
              const batchCards = getVideosForBatch(batch.id).map(toClientVideoCard)
              const doneCount = batchCards.filter((c) => c.owner === 'done').length
              return (
                <li
                  key={batch.id}
                  className="border-border bg-background/85 rounded-2xl border px-5 py-4 backdrop-blur-xl"
                  style={{
                    boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Folder className="text-muted-foreground size-4" aria-hidden />
                    <span className="text-foreground font-medium">{batch.title}</span>
                    <span className="text-muted-foreground text-xs">
                      Batch {batch.batchNumber} · {doneCount} video
                      {doneCount === 1 ? '' : 's'} scheduled
                      {batch.creditsDebited ? ' · Credits debited' : null}
                    </span>
                  </div>
                  {batch.batchSchedule ? (
                    <p className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-xs">
                      <Clock className="size-3.5" aria-hidden />
                      {batch.batchSchedule.platform} · Go-live{' '}
                      {formatDate(batch.batchSchedule.goLiveAt.slice(0, 10))}
                    </p>
                  ) : null}
                  <ul className="text-foreground mt-3 space-y-1 text-sm">
                    {batchCards.map((v) => (
                      <li key={v.id}>{v.editorPublishTitle?.trim() || v.title}</li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {activeBatches.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Still in progress
          </h2>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {activeBatches.map((b) => (
              <li key={b.id}>
                {b.title} (batch {b.batchNumber})
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
