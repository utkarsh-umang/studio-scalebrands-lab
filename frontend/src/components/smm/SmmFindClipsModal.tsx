import { useState } from 'react'
import { ExternalLink, FolderOpen, Link2, Scissors, X } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  open: boolean
  onClose: () => void
}

export function SmmFindClipsModal({ batch, clientName, open, onClose }: Props) {
  const { theme } = useTheme()
  const { submitSmmClipsFolder } = useAdminWorkspace()
  const [clipsFolderUrl, setClipsFolderUrl] = useState(batch.clipsFolderUrl ?? '')
  const [submitted, setSubmitted] = useState(false)

  const rawUrl =
    batch.sourceMediaUrl?.trim() || batch.footageUrl?.trim() || ''
  const primary = theme.colors.primary

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clipsFolderUrl.trim()) return
    submitSmmClipsFolder(batch.id, clipsFolderUrl.trim())
    setSubmitted(true)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="find-clips-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="border-border bg-background relative z-10 w-full max-w-lg rounded-2xl border p-5 shadow-xl"
        style={{
          boxShadow: `0 24px 80px -20px rgba(5, 9, 14, 0.25), 0 0 0 1px ${primary}18 inset`,
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p
              id="find-clips-title"
              className="text-foreground font-[family-name:var(--heading)] text-lg font-bold"
            >
              Find clips
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {clientName} · {batch.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1"
            aria-label="Close dialog"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          Open the client&apos;s raw footage in a new tab, cut clips in your
          usual tools, then upload cuts to Drive and paste the folder link below.
          We&apos;ll send that folder to the client for clip approval.
        </p>

        {rawUrl ? (
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:border-primary/40 mb-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: primary }}
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            Open raw footage
          </a>
        ) : (
          <p className="text-muted-foreground border-border mb-4 rounded-xl border border-dashed px-3 py-2.5 text-xs">
            Waiting for the client to submit a source link for this batch.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label
            htmlFor="clips-folder-url"
            className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            <FolderOpen className="size-3" aria-hidden />
            Clips folder (Drive)
          </label>
          <input
            id="clips-folder-url"
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
            Links only — no file uploads inside Studio.
          </p>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="border-border text-foreground hover:bg-muted/50 rounded-xl border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rawUrl || !clipsFolderUrl.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: primary }}
            >
              <Link2 className="size-3.5" aria-hidden />
              {submitted ? 'Submitted' : 'Submit clips folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
