import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { StudioModalShell } from '@/components/StudioModalShell'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  open: boolean
  onClose: () => void
}

export function EditorVideosDriveModal({
  batch,
  clientName,
  open,
  onClose,
}: Props) {
  const { submitEditorVideosDrive } = useAdminWorkspace()
  const [driveUrl, setDriveUrl] = useState(batch.editorDeliverablesDriveUrl ?? '')

  if (!open) return null

  return (
    <StudioModalShell
      title="Videos created"
      subtitle={`${clientName} · ${batch.title}`}
      titleId="editor-videos-drive-title"
      onClose={onClose}
    >
      <div className="max-w-lg space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Upload your final edited videos into a shared Drive folder. Create a{' '}
          <span className="text-foreground font-medium">Videos</span> subfolder for
          the exports, then paste the folder link below. This starts the QA cycle
          with your SMM and the client.
        </p>
        <ol className="text-muted-foreground list-decimal space-y-1 pl-4 text-xs">
          <li>Create or open the batch deliverables folder on Drive</li>
          <li>Add a folder named <strong className="text-foreground">Videos</strong></li>
          <li>Upload each final short into that folder</li>
          <li>Paste the shareable folder link here</li>
        </ol>
        {batch.clipsFolderUrl && (
          <p className="text-muted-foreground text-xs">
            Clips reference:{' '}
            <a
              href={batch.clipsFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground inline-flex items-center gap-1 font-medium underline"
            >
              Open clips folder
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        )}
        <label className="block space-y-1.5">
          <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
            Deliverables Drive link
          </span>
          <input
            type="url"
            value={driveUrl}
            onChange={(e) => {
              setDriveUrl(e.target.value)
            }}
            placeholder="https://drive.google.com/drive/folders/…"
            className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            disabled={!driveUrl.trim()}
            onClick={() => {
              submitEditorVideosDrive(batch.id, driveUrl)
              onClose()
            }}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Share link &amp; start QA
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
