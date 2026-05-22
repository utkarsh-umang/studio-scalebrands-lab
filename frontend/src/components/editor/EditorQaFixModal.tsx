import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { StudioModalShell } from '@/components/StudioModalShell'
import { DriveSyncButton, DriveSyncMeta } from '@/components/path-b'
import { EditorQaFixPanel } from '@/components/editor/EditorQaFixPanel'
import type { EditorPathBVideoCard } from '@/lib/editorBoard'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'
import { deliverableIndexForTicket } from '@/lib/driveMedia'
import { SAMPLE_VIDEO_SRC } from '@mockData/index'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  card: EditorPathBVideoCard
  open: boolean
  onClose: () => void
}

export function EditorQaFixModal({ batch, clientName, card, open, onClose }: Props) {
  const { manifest, syncing, error, sync } = useDriveManifestSync(
    batch.id,
    open ? card.id : undefined,
  )

  if (!open) return null

  const index = deliverableIndexForTicket(card)
  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  return (
    <StudioModalShell
      title="Fix QA feedback"
      subtitle={`${clientName} · #${index} · ${card.title}`}
      titleId="editor-qa-fix-title"
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
      bodyScroll={false}
    >
      <EditorQaFixPanel
        batch={batch}
        clientName={clientName}
        ticket={card}
        manifest={manifest}
        fallbackVideoSrc={SAMPLE_VIDEO_SRC}
        onResubmitted={onClose}
      />
    </StudioModalShell>
  )
}
