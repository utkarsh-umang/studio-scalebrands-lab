import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import type { EditorVideoCard } from '@/lib/editorBoard'
import { StudioModalShell } from '@/components/StudioModalShell'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  card: EditorVideoCard
  open: boolean
  onClose: () => void
}

export function EditorVideoTitleModal({
  batch,
  clientName,
  card,
  open,
  onClose,
}: Props) {
  const { submitEditorVideoTitle } = useAdminWorkspace()
  const [title, setTitle] = useState(card.editorPublishTitle ?? '')

  if (!open) return null

  const driveUrl = batch.editorDeliverablesDriveUrl

  return (
    <StudioModalShell
      title="Video titles"
      subtitle={`${clientName} · ${card.title}`}
      titleId="editor-video-title-modal"
      onClose={onClose}
    >
      <div className="max-w-lg space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          After the QA cycle is complete, choose the publish title for this short.
          Submitting sends the title and deliverables folder to your SMM for
          scheduling.
        </p>
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-muted/30 text-foreground flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
          >
            Open deliverables folder
            <ExternalLink className="ml-auto size-3.5 shrink-0" aria-hidden />
          </a>
        )}
        <label className="block space-y-1.5">
          <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
            Publish title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
            placeholder="e.g. 5 Python tricks in 60 seconds"
            className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            disabled={!title.trim()}
            onClick={() => {
              submitEditorVideoTitle(card.id, title)
              onClose()
            }}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Send to SMM
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
