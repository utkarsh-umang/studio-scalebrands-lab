import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

/** Placeholder until Kanban columns per role are built. */
export function AdminBatchBoard() {
  const { clientId, batchId } = useParams<{
    clientId: string
    batchId: string
  }>()
  const { theme } = useTheme()
  const { getClient, batches } = useAdminWorkspace()

  const client = clientId ? getClient(clientId) : undefined
  const batch =
    batchId && clientId
      ? batches.find((b) => b.id === batchId && b.clientId === clientId)
      : undefined

  const primary = theme.colors.primary

  if (!clientId || !client || !batch) {
    return <Navigate to="/admin" replace />
  }

  return (
    <>
      <Link
        to={`/admin/clients/${client.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {client.displayName}
      </Link>

      <ClientPageHeader
        title={batch.title}
        subtitle={`Raw-footage batch · ${batch.videoCount} videos · Updated ${formatDate(batch.updatedAt)}`}
      />

      <div
        className="border-border bg-background/85 flex flex-col items-center justify-center gap-4 rounded-2xl border px-6 py-16 text-center backdrop-blur-xl"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        }}
      >
        <div
          className="flex size-14 items-center justify-center rounded-2xl"
          style={{ background: `${primary}14`, border: `1px solid ${primary}30` }}
        >
          <LayoutGrid className="size-7" style={{ color: primary }} aria-hidden />
        </div>
        <div>
          <p className="text-foreground text-base font-semibold">
            Video board coming next
          </p>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
            This folder is the epic. Videos will appear as tickets in status
            columns (Yet to start → In progress → In review → Completed) per
            role.
          </p>
          {batch.footageUrl && (
            <p className="text-muted-foreground mt-3 text-xs">
              Footage:{' '}
              <a
                href={batch.footageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                {batch.footageUrl}
              </a>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
