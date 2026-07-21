import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { ClientRevisionTriageRequest } from '@/client'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { StudioModalShell } from '@/components/StudioModalShell'
import { DeliverableSummaryPanel, DriveSyncButton, DriveSyncMeta } from '@/components/path-b'
import { SmmClientRevisionPanel } from '@/components/smm/SmmClientRevisionPanel'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'
import { deliverableIndexForTicket } from '@/lib/driveMedia'
import { readinessForDeliverable } from '@/lib/pathBDeliverables'
import { videoNeedsSmmClientRevision } from '@/lib/smmBoard'
import { useClientRevisionTriageMutation } from '@/hooks/api/pathB/useClientQaMutations'

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
  const triageRevision = useClientRevisionTriageMutation()
  const { manifest, syncing, error, sync } = useDriveManifestSync(
    batch.id,
    open ? ticket.id : undefined,
  )

  const index = deliverableIndexForTicket(ticket)
  const readiness = useMemo(
    () => readinessForDeliverable(batch.id, index, ticket, manifest),
    [batch.id, index, ticket, manifest],
  )
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
            readiness={readiness}
            defaultOpenSections={[]}
            onSyncDrive={() => {
              void sync()
            }}
            driveSyncing={syncing}
          />
          <SmmClientRevisionPanel
            ticket={ticket}
            clientComments={clientComments}
            onRouteToEditor={() => {
              triageRevision.mutate(
                { videoTicketId: ticket.id, body: { route: ClientRevisionTriageRequest.route.EDITOR } },
                { onSuccess: onClose },
              )
            }}
            onUpdateAssets={() => {
              triageRevision.mutate(
                { videoTicketId: ticket.id, body: { route: ClientRevisionTriageRequest.route.SMM_ASSETS } },
                {
                  onSuccess: () => {
                    onClose()
                    onOpenProduction()
                  },
                },
              )
            }}
          />
        </div>
      )}
    </StudioModalShell>
  )
}
