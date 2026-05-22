import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { StudioModalShell } from '@/components/StudioModalShell'
import { DeliverableSummaryPanel, DriveSyncButton, DriveSyncMeta } from '@/components/path-b'
import { SmmClientRevisionPanel } from '@/components/smm/SmmClientRevisionPanel'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'
import { deliverableIndexForTicket } from '@/lib/driveMedia'
import { videoNeedsSmmClientRevision } from '@/lib/smmBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  ticket: AdminVideoTicket
  open: boolean
  onClose: () => void
  onOpenProduction: () => void
}

export function SmmClientRevisionModal({
  batch,
  clientName,
  ticket,
  open,
  onClose,
  onOpenProduction,
}: Props) {
  const { smmTriageClientRevision } = useAdminWorkspace()
  const { manifest, syncing, error, sync } = useDriveManifestSync(
    batch.id,
    open ? ticket.id : undefined,
  )

  const index = deliverableIndexForTicket(ticket)
  const clientComments = useMemo(
    () =>
      (ticket.qaCommentHistory ?? []).filter(
        (c) => c.authorRole === 'client' && !c.deprecated,
      ),
    [ticket.qaCommentHistory],
  )

  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  if (!open) return null

  return (
    <StudioModalShell
      title="Client revisions"
      subtitle={`${clientName} · #${index} · ${ticket.title}`}
      titleId="smm-client-revision-title"
      onClose={onClose}
      headerAside={
        folderUrl ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DriveSyncButton
              onSync={() => {
                void sync()
              }}
              syncing={syncing}
            />
            <a
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
            >
              Deliverables folder
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
          </div>
        ) : null
      }
      headerMeta={<DriveSyncMeta manifest={manifest} errorMessage={error} />}
    >
      {!videoNeedsSmmClientRevision(ticket) ? (
        <p className="text-muted-foreground text-sm">
          This deliverable is not waiting on client-revision triage.
        </p>
      ) : (
        <div className="space-y-5">
          <DeliverableSummaryPanel
            batch={batch}
            deliverableIndex={index}
            ticket={ticket}
            manifest={manifest}
            titleEditable={false}
            onSyncDrive={() => {
              void sync()
            }}
            driveSyncing={syncing}
          />
          <SmmClientRevisionPanel
            ticket={ticket}
            clientComments={clientComments}
            onRouteToEditor={() => {
              smmTriageClientRevision(ticket.id, 'editor')
              onClose()
            }}
            onUpdateAssets={() => {
              smmTriageClientRevision(ticket.id, 'smm_assets')
              onClose()
              onOpenProduction()
            }}
          />
        </div>
      )}
    </StudioModalShell>
  )
}
