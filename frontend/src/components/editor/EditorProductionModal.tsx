import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { StudioModalShell } from '@/components/StudioModalShell'
import {
  DeliverableReadinessStrip,
  DeliverableSummaryPanel,
  DriveSyncButton,
  DriveSyncMeta,
} from '@/components/path-b'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'
import { readinessForDeliverable } from '@/lib/pathBDeliverables'
import { deliverableIndexForTicket } from '@/lib/driveMedia'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { editorNeedsProductionWork } from '@/lib/editorBoard'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  ticket: AdminVideoTicket
  open: boolean
  onClose: () => void
}

export function EditorProductionModal({
  batch,
  clientName,
  ticket,
  open,
  onClose,
}: Props) {
  const { saveVideoPublishTitle, sendEditorDeliverableToSmmQa } = useAdminWorkspace()
  const { manifest, syncing, error, sync } = useDriveManifestSync(
    batch.id,
    open ? ticket.id : undefined,
  )

  const index = deliverableIndexForTicket(ticket)
  const readiness = useMemo(
    () => readinessForDeliverable(batch.id, index, ticket, manifest),
    [batch.id, index, ticket, manifest],
  )

  if (!open) return null

  const canSendSmm = editorNeedsProductionWork(ticket) && readiness.allReady
  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  return (
    <StudioModalShell
      title={ticket.title}
      subtitle={`${clientName} · #${index} · Production`}
      titleId="editor-production-title"
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
      <div className="space-y-4">
        <DeliverableSummaryPanel
          batch={batch}
          deliverableIndex={index}
          ticket={ticket}
          manifest={manifest}
          titleEditable
          onSaveTitle={(title) => {
            saveVideoPublishTitle(ticket.id, title)
          }}
          onSyncDrive={() => {
            void sync()
          }}
          driveSyncing={syncing}
        />

        <DeliverableReadinessStrip
          videoReady={readiness.videoReady}
          thumbnailReady={readiness.thumbnailReady}
          titleReady={readiness.titleReady}
          ctaLabel="Send to SMM QA"
          ctaDisabled={!canSendSmm}
          onCta={
            canSendSmm
              ? () => {
                  sendEditorDeliverableToSmmQa(ticket.id)
                  onClose()
                }
              : undefined
          }
        />

        {!editorNeedsProductionWork(ticket) ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            This deliverable is with SMM or the client — preview only.
          </p>
        ) : null}
      </div>
    </StudioModalShell>
  )
}
