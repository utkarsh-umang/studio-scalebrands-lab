import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { StudioModalShell } from '@/components/StudioModalShell'
import {
  DeliverableReadinessStrip,
  DeliverableSummaryPanel,
  DriveSyncButton,
  DriveSyncMeta,
} from '@/components/path-b'
import {
  useDeliverableDriveSyncMutation,
  useSubmitToSmmQaMutation,
  useUpdateProductionMutation,
} from '@/hooks/api/pathB/useProductionMutations'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'
import { editorNeedsProductionWork } from '@/lib/editorBoard'
import { deliverableIndexForTicket } from '@/lib/driveMedia'
import { driveSyncRequestFromManifest } from '@/lib/productionDriveSync'
import {
  entryMissingForSubmitter,
  readinessForDeliverable,
  submitReadinessForDeliverable,
} from '@/lib/pathBDeliverables'
import { apiErrorMessage } from '@/lib/apiError'

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
  const updateProduction = useUpdateProductionMutation(ticket.id)
  const driveSync = useDeliverableDriveSyncMutation(ticket.id)
  const submitToSmmQa = useSubmitToSmmQaMutation(ticket.id)
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

  // Only what the editor owns gates the handoff — an SMM- or client-owned
  // thumbnail/title is completed later, and client release still needs all three.
  const canSendSmm =
    editorNeedsProductionWork(ticket) &&
    entryMissingForSubmitter(readiness, batch, 'editor').length === 0
  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  const handleSyncDrive = async () => {
    const nextManifest = await sync()
    const body = driveSyncRequestFromManifest(index, nextManifest)
    if (!body) return
    driveSync.mutate(body)
  }

  /**
   * The server only counts Drive files that were recorded on the ticket, so a
   * deliverable the UI shows as ready (because the manifest lists it) can still
   * be rejected if the sync was never persisted. Record it first, then submit —
   * otherwise the button appears to do nothing.
   */
  const handleSendToSmmQa = async () => {
    try {
      if (folderUrl && !submitReadinessForDeliverable(ticket).allReady) {
        const nextManifest = await sync()
        const body = driveSyncRequestFromManifest(index, nextManifest)
        if (body) await driveSync.mutateAsync(body)
      }
      await submitToSmmQa.mutateAsync()
      onClose()
    } catch {
      // Left open on purpose: the message below explains what failed, and
      // closing would hide it. Mutation state carries the error.
    }
  }

  const sendError = submitToSmmQa.isError
    ? apiErrorMessage(submitToSmmQa.error, 'Could not send this video to SMM QA.')
    : driveSync.isError
      ? apiErrorMessage(driveSync.error, 'Could not record the Drive files.')
      : null

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
                void handleSyncDrive()
              }}
              syncing={syncing || driveSync.isPending}
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
          readiness={readiness}
          defaultOpenSections={[]}
          titleEditable
          onSaveTitle={(title) => {
            updateProduction.mutate({ editorPublishTitle: title })
          }}
          onSyncDrive={() => {
            void handleSyncDrive()
          }}
          driveSyncing={syncing || driveSync.isPending}
        />

        <DeliverableReadinessStrip
          videoReady={readiness.videoReady}
          thumbnailReady={readiness.thumbnailReady}
          titleReady={readiness.titleReady}
          showChecklist={false}
          ctaLabel="Send to SMM QA"
          ctaDisabled={
            !canSendSmm || submitToSmmQa.isPending || driveSync.isPending || syncing
          }
          onCta={
            canSendSmm
              ? () => {
                  void handleSendToSmmQa()
                }
              : undefined
          }
        />

        {sendError ? (
          <p className="text-destructive text-xs leading-relaxed" role="alert">
            {sendError}
          </p>
        ) : null}

        {!editorNeedsProductionWork(ticket) ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            This deliverable is with SMM or the client — preview only.
          </p>
        ) : null}
      </div>
    </StudioModalShell>
  )
}
