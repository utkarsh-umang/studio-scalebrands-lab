import { useState } from 'react'
import { ExternalLink, FolderOpen, Link2, Scissors } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  onSubmitted?: () => void
}

export function SmmFindClipsPanel({ batch, clientName, onSubmitted }: Props) {
  const { theme } = useTheme()
  const { submitSmmClipsFolder } = useAdminWorkspace()
  const [clipsFolderUrl, setClipsFolderUrl] = useState(batch.clipsFolderUrl ?? '')

  const rawUrl =
    batch.sourceMediaUrl?.trim() || batch.footageUrl?.trim() || ''
  const primary = theme.colors.primary

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clipsFolderUrl.trim()) return
    submitSmmClipsFolder(batch.id, clipsFolderUrl.trim())
    onSubmitted?.()
  }

  return (
    <div className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          For <span className="text-foreground font-medium">{clientName}</span>: open the
          client&apos;s raw footage in a new tab, cut clips in your usual tools, then upload
          cuts to Drive and paste the folder link below.
        </p>

      {rawUrl ? (
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border hover:border-primary/40 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
          style={{ color: primary }}
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          Open raw footage
        </a>
      ) : (
        <p className="text-muted-foreground border-border rounded-xl border border-dashed px-3 py-2.5 text-xs">
          Waiting for the client to submit a source link for this batch.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="clips-folder-url-panel"
          className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
        >
          <FolderOpen className="size-3" aria-hidden />
          Clips folder (Drive)
        </label>
        <input
          id="clips-folder-url-panel"
          type="url"
          value={clipsFolderUrl}
          onChange={(e) => {
            setClipsFolderUrl(e.target.value)
          }}
          placeholder="https://drive.google.com/drive/folders/..."
          disabled={!rawUrl}
          className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50"
        />
        <p className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-snug">
          <Scissors className="mt-0.5 size-3 shrink-0 opacity-70" aria-hidden />
          Share the folder with{' '}
          <span className="text-foreground font-mono text-[10px] break-all">
            studio-drive-reader@enlead-ai.iam.gserviceaccount.com
          </span>
          — links only; no uploads inside Studio.
        </p>
        <button
          type="submit"
          disabled={!rawUrl || !clipsFolderUrl.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: primary }}
        >
          <Link2 className="size-3.5" aria-hidden />
          Submit clips folder
        </button>
      </form>
    </div>
  )
}
