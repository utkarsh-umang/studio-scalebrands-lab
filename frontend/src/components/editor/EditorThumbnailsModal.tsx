import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { StudioModalShell } from '@/components/StudioModalShell'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  videoTitle: string
  open: boolean
  onClose: () => void
}

export function EditorThumbnailsModal({
  batch,
  clientName,
  videoTitle,
  open,
  onClose,
}: Props) {
  const { submitEditorThumbnailsForReview } = useAdminWorkspace()

  if (!open) return null

  const driveUrl = batch.editorDeliverablesDriveUrl

  return (
    <StudioModalShell
      title="Thumbnails created"
      subtitle={`${clientName} · ${videoTitle}`}
      titleId="editor-thumbnails-title"
      onClose={onClose}
    >
      <div className="max-w-lg space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          In the same deliverables folder, create a{' '}
          <span className="text-foreground font-medium">Thumbnails</span> subfolder
          and upload one image per video. When ready, send them to the client for
          thumbnail QA.
        </p>
        {driveUrl ? (
          <a
            href={driveUrl}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-muted/30 text-foreground flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
          >
            Open deliverables folder
            <ExternalLink className="ml-auto size-3.5 shrink-0" aria-hidden />
          </a>
        ) : (
          <p className="text-muted-foreground text-xs">
            Share the videos folder link first so the deliverables folder is set.
          </p>
        )}
        <ol className="text-muted-foreground list-decimal space-y-1 pl-4 text-xs">
          <li>Open the batch deliverables folder</li>
          <li>
            Add <strong className="text-foreground">Thumbnails</strong> next to{' '}
            <strong className="text-foreground">Videos</strong>
          </li>
          <li>Upload thumbnail images matching each short</li>
          <li>Send to client when uploads are complete</li>
        </ol>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            disabled={!driveUrl?.trim()}
            onClick={() => {
              submitEditorThumbnailsForReview(batch.id)
              onClose()
            }}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Send thumbnails to client
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-border rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </StudioModalShell>
  )
}
