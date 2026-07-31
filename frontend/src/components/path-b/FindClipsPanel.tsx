import { useState } from 'react'
import { ExternalLink, Film, FolderOpen, Link2, Scissors } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import {
  useSubmitClipsFolderMutation,
} from '@/hooks/api/pathB/useClipsFolderMutations'
import { useTheme } from '@/theme'

export type FindClipsPanelRole = 'smm' | 'editor'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  role?: FindClipsPanelRole
  onSubmitted?: () => void
}

export function FindClipsPanel({
  batch,
  clientName,
  role = 'smm',
  onSubmitted,
}: Props) {
  const { theme } = useTheme()
  const submitClipsFolder = useSubmitClipsFolderMutation(batch.id)
  const [clipsFolderUrl, setClipsFolderUrl] = useState(batch.clipsFolderUrl ?? '')

  const rawUrl = batch.sourceMediaUrl?.trim() || batch.footageUrl?.trim() || ''
  const primary = theme.colors.primary

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = clipsFolderUrl.trim()
    if (!trimmed || submitClipsFolder.isPending) return
    submitClipsFolder.mutate(
      { clipsFolderUrl: trimmed },
      {
        onSuccess: () => {
          onSubmitted?.()
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground mx-auto max-w-xl text-center text-sm leading-relaxed">
        For <span className="text-foreground font-medium">{clientName}</span>: open the
        client&apos;s raw footage, cut clips in your usual tools, then upload numbered cuts to
        Drive and paste the folder link below.
      </p>

      {rawUrl ? (
        <section className="border-border bg-muted/15 rounded-2xl border px-5 py-6 text-center">
          <span
            className="mx-auto flex size-11 items-center justify-center rounded-2xl"
            style={{ background: `${primary}14`, color: primary }}
          >
            <Film className="size-5" aria-hidden />
          </span>
          <p className="text-foreground mt-3 text-sm font-semibold">Source footage is ready</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs leading-relaxed">
            Open the client&apos;s source in a new tab and keep this task open while you identify
            the strongest moments.
          </p>
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-4 inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: primary }}
          >
            Open source footage
            <ExternalLink className="size-3.5 shrink-0 opacity-75" aria-hidden />
          </a>
        </section>
      ) : (
        <p className="text-muted-foreground border-border rounded-2xl border border-dashed px-4 py-7 text-center text-xs">
          Waiting for the client to submit a source link for this batch.
        </p>
      )}

      {role === 'editor' ? (
        <p className="text-muted-foreground border-border bg-muted/15 rounded-xl border px-3 py-2.5 text-xs leading-relaxed">
          Clip identification may be done by you or your SMM — your CSM coordinates who owns this
          step per batch. Submitting here uses the same workflow as the SMM board.
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="border-border space-y-3 border-t pt-5"
      >
        <div>
          <label
            htmlFor={`clips-folder-url-${role}`}
            className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
          >
            <FolderOpen className="size-3.5" style={{ color: primary }} aria-hidden />
            Add the numbered clips folder
          </label>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Paste the Drive link after every selected clip has been exported and numbered.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={`clips-folder-url-${role}`}
            type="url"
            value={clipsFolderUrl}
            onChange={(e) => {
              setClipsFolderUrl(e.target.value)
            }}
            placeholder="https://drive.google.com/drive/folders/..."
            disabled={!rawUrl || submitClipsFolder.isPending}
            className="border-border bg-background text-foreground focus:ring-primary/30 min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!rawUrl || !clipsFolderUrl.trim() || submitClipsFolder.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: primary }}
          >
            <Link2 className="size-3.5" aria-hidden />
            {submitClipsFolder.isPending ? 'Submitting…' : 'Submit clips folder'}
          </button>
        </div>
        <p className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-snug">
          <Scissors className="mt-0.5 size-3 shrink-0 opacity-70" aria-hidden />
          Share the folder with{' '}
          <span className="text-foreground font-mono text-[10px] break-all">
            studio-drive-reader@enlead-ai.iam.gserviceaccount.com
          </span>
          — links only; no uploads inside Studio.
        </p>
        {submitClipsFolder.isError ? (
          <p className="text-destructive text-[11px] leading-snug" role="alert">
            Could not submit clips folder. Check the link and try again.
          </p>
        ) : null}
      </form>
    </div>
  )
}
