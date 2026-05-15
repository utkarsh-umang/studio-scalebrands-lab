import { useState } from 'react'
import { Link2, Mic, FolderOpen } from 'lucide-react'
import type { AdminBatchFolder, BatchIntakePath } from '@mockData/index'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
}

export function ClientBatchIntakeCard({ batch }: Props) {
  const { theme } = useTheme()
  const { submitBatchIntake } = useAdminWorkspace()
  const [path, setPath] = useState<BatchIntakePath>(
    batch.intakePath ?? 'source_media',
  )
  const [url, setUrl] = useState(
    batch.intakePath === 'clips_ready'
      ? (batch.clipsFolderUrl ?? '')
      : (batch.sourceMediaUrl ?? batch.footageUrl ?? ''),
  )
  const [expanded, setExpanded] = useState(true)

  const primary = theme.colors.primary
  const submitted =
    path === 'clips_ready'
      ? Boolean(batch.clipsFolderUrl?.trim())
      : Boolean(batch.sourceMediaUrl?.trim() || batch.footageUrl?.trim())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    submitBatchIntake(batch.id, path, url.trim())
  }

  return (
    <div
      className="border-border bg-background w-full rounded-lg border p-3 shadow-sm"
      style={{ borderColor: `${primary}40` }}
    >
      <button
        type="button"
        onClick={() => {
          setExpanded((v) => !v)
        }}
        className="flex w-full items-start gap-2 text-left"
      >
        {path === 'clips_ready' ? (
          <FolderOpen
            className="mt-0.5 size-3.5 shrink-0"
            style={{ color: primary }}
            aria-hidden
          />
        ) : (
          <Mic
            className="mt-0.5 size-3.5 shrink-0"
            style={{ color: primary }}
            aria-hidden
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="text-foreground block text-xs font-semibold">
            {submitted ? 'Batch kickoff submitted' : 'Start this batch'}
          </span>
          <span className="text-muted-foreground block text-[10px] leading-snug">
            {path === 'clips_ready'
              ? 'Clips folder — skips to editor'
              : 'Podcast or raw footage link'}
          </span>
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
          <fieldset className="space-y-2">
            <legend className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
              How are you starting?
            </legend>
            <label className="border-border hover:border-primary/30 flex cursor-pointer items-start gap-2 rounded-lg border p-2.5">
              <input
                type="radio"
                name={`intake-path-${batch.id}`}
                checked={path === 'source_media'}
                onChange={() => {
                  setPath('source_media')
                  setUrl(batch.sourceMediaUrl ?? batch.footageUrl ?? '')
                }}
                className="mt-0.5"
              />
              <span className="text-xs leading-snug">
                <span className="text-foreground font-semibold">
                  Podcast or raw footage
                </span>
                <span className="text-muted-foreground block">
                  YouTube, Spotify, Drive, Dropbox, etc. — we identify clips for
                  you.
                </span>
              </span>
            </label>
            <label className="border-border hover:border-primary/30 flex cursor-pointer items-start gap-2 rounded-lg border p-2.5">
              <input
                type="radio"
                name={`intake-path-${batch.id}`}
                checked={path === 'clips_ready'}
                onChange={() => {
                  setPath('clips_ready')
                  setUrl(batch.clipsFolderUrl ?? '')
                }}
                className="mt-0.5"
              />
              <span className="text-xs leading-snug">
                <span className="text-foreground font-semibold">
                  I already have a clips folder
                </span>
                <span className="text-muted-foreground block">
                  Share your Drive folder — we go straight to the editor (no clip
                  review round).
                </span>
              </span>
            </label>
          </fieldset>

          <form onSubmit={handleSubmit} className="space-y-2">
            <label
              htmlFor={`intake-url-${batch.id}`}
              className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
            >
              <Link2 className="size-3" aria-hidden />
              {path === 'clips_ready' ? 'Clips folder link' : 'Source link'}
            </label>
            <input
              id={`intake-url-${batch.id}`}
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
              }}
              placeholder={
                path === 'clips_ready'
                  ? 'https://drive.google.com/drive/folders/...'
                  : 'https://youtube.com/... or drive/dropbox link'
              }
              className="border-border bg-background text-foreground w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <p className="text-muted-foreground text-[10px] leading-snug">
              Links only — we do not accept file uploads in Studio.
            </p>
            <button
              type="submit"
              disabled={!url.trim()}
              className="bg-primary text-primary-foreground disabled:opacity-50 w-full rounded-lg py-1.5 text-xs font-semibold"
            >
              {submitted ? 'Update link' : 'Submit link'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
