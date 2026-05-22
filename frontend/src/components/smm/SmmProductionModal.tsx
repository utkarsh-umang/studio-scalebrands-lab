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
import { deliverableIndexForTicket } from '@/lib/driveMedia'
import { readinessForDeliverable } from '@/lib/pathBDeliverables'
import { smmCanEditEditorDeliverable, smmNeedsAssetPrep } from '@/lib/smmBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  ticket: AdminVideoTicket
  open: boolean
  onClose: () => void
}

export function SmmProductionModal({
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

  const smmOwnedPrep = smmNeedsAssetPrep(ticket, batch)
  const editorAssist = smmCanEditEditorDeliverable(ticket, batch)
  const canReturnToQa = smmOwnedPrep && readiness.allReady
  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  return (
    <StudioModalShell
      title={ticket.title}
      subtitle={`${clientName} · #${index} · Thumbnail & title`}
      titleId="smm-production-title"
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
        {editorAssist ? (
          <p className="text-muted-foreground border-border bg-muted/15 rounded-xl border px-3 py-2.5 text-xs leading-relaxed">
            This video is with the editor. You can set the publish title here and upload
            thumbnails to the deliverables folder on Drive. The editor sends the package to SMM QA
            when all three deliverables are ready.
          </p>
        ) : null}

        <DeliverableSummaryPanel
          batch={batch}
          deliverableIndex={index}
          ticket={ticket}
          manifest={manifest}
          readiness={readiness}
          defaultOpenSections={[]}
          titleEditable
          onSaveTitle={(title) => {
            saveVideoPublishTitle(ticket.id, title)
          }}
          onSyncDrive={() => {
            void sync()
          }}
          driveSyncing={syncing}
        />

        {smmOwnedPrep ? (
          <DeliverableReadinessStrip
            videoReady={readiness.videoReady}
            thumbnailReady={readiness.thumbnailReady}
            titleReady={readiness.titleReady}
            showChecklist={false}
            ctaLabel="Return to SMM QA"
            ctaDisabled={!canReturnToQa}
            onCta={() => {
              sendEditorDeliverableToSmmQa(ticket.id)
              onClose()
            }}
          />
        ) : null}
      </div>
    </StudioModalShell>
  )
}
