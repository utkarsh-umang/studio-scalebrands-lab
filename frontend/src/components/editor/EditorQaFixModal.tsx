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

export function EditorQaFixModal({
  batch,
  clientName,
  card,
  open,
  onClose,
}: Props) {
  const { resubmitEditorVideoQa } = useAdminWorkspace()

  if (!open) return null

  return (
    <StudioModalShell
      title="Fix QA feedback"
      subtitle={`${clientName} · ${card.title}`}
      titleId="editor-qa-fix-title"
      onClose={onClose}
    >
      <div className="max-w-lg space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Update the files in your Drive{' '}
          <span className="text-foreground font-medium">Videos</span> folder, then
          resubmit when the fixes are ready for SMM to review again.
        </p>
        {batch.editorDeliverablesDriveUrl && (
          <a
            href={batch.editorDeliverablesDriveUrl}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-muted/30 text-foreground flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
          >
            Open deliverables folder
            <ExternalLink className="ml-auto size-3.5 shrink-0" aria-hidden />
          </a>
        )}
        {card.qaGeneralNote && (
          <div className="border-border rounded-xl border p-3">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
              General note
            </p>
            <p className="text-foreground mt-1 text-sm">{card.qaGeneralNote}</p>
          </div>
        )}
        {card.qaFlags && card.qaFlags.length > 0 && (
          <ul className="space-y-2">
            {card.qaFlags.map((flag) => (
              <li
                key={flag.id}
                className="border-border text-foreground rounded-lg border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground text-[10px] font-semibold tabular-nums">
                  {formatTimestamp(flag.atSeconds)}
                </span>
                <p className="mt-0.5">{flag.note}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              resubmitEditorVideoQa(card.id)
              onClose()
            }}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Resubmit to SMM
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

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
