import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { StudioModalShell } from '@/components/StudioModalShell'
import { SmmVideoQaWorkspace } from '@/components/smm/SmmVideoQaWorkspace'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import {
  formatSyncedAt,
  getManifestForBatch,
  reloadDriveManifestForBatch,
} from '@/lib/driveMedia'
import type { SmmVideoCard } from '@/lib/smmBoard'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  batchTickets: AdminVideoTicket[]
  initialCard: SmmVideoCard
  open: boolean
  onClose: () => void
}

/** @deprecated Prefer opening {@link SmmBatchDetailModal} from the batch board */
export function SmmVideoQaModal({
  batch,
  clientName,
  batchTickets,
  initialCard,
  open,
  onClose,
}: Props) {
  const [manifestOverride, setManifestOverride] = useState<
    BatchDriveManifest | undefined
  >(undefined)
  const [driveSyncing, setDriveSyncing] = useState(false)
  const [driveSyncMessage, setDriveSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    setManifestOverride(undefined)
    setDriveSyncMessage(null)
  }, [batch.id, open])

  const handleSyncDrive = useCallback(async () => {
    setDriveSyncing(true)
    setDriveSyncMessage(null)
    try {
      const next = await reloadDriveManifestForBatch(batch.id)
      if (next) {
        setManifestOverride(next)
      } else {
        setDriveSyncMessage('No manifest for this batch yet.')
      }
    } catch {
      setDriveSyncMessage('Could not reload manifest — try a full page refresh.')
    } finally {
      setDriveSyncing(false)
    }
  }, [batch.id])

  if (!open) return null

  const manifest = manifestOverride ?? getManifestForBatch(batch.id)
  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  const headerMeta = (
    <>
      {manifest ? (
        <>
          Last synced {formatSyncedAt(manifest.syncedAt)}
          {manifest.unmapped.length > 0 && (
            <span className="text-destructive">
              {' '}
              · {manifest.unmapped.length} unmapped file(s)
            </span>
          )}
        </>
      ) : (
        'No Drive manifest loaded.'
      )}
      {driveSyncMessage ? (
        <span className="text-destructive">
          {' '}
          · {driveSyncMessage}
        </span>
      ) : null}
    </>
  )

  const headerAside = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => {
          void handleSyncDrive()
        }}
        disabled={driveSyncing}
        className="border-border bg-muted/30 hover:border-primary/35 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`size-3.5 ${driveSyncing ? 'animate-spin' : ''}`} aria-hidden />
        Sync from Drive
      </button>
      {folderUrl ? (
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors"
        >
          Go to Drive
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
      ) : null}
    </div>
  )

  return (
    <StudioModalShell
      title="Video QA"
      subtitle={`${clientName} · ${batch.title}`}
      titleId="smm-qa-title"
      onClose={onClose}
      headerAside={headerAside}
      headerMeta={headerMeta}
    >
      <SmmVideoQaWorkspace
        batch={batch}
        clientName={clientName}
        batchTickets={batchTickets}
        initialCard={initialCard}
        manifest={manifest}
        onClose={onClose}
      />
    </StudioModalShell>
  )
}
