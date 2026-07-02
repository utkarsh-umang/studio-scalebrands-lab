import { useState } from 'react'
import { Copy, Lightbulb, Link2, Mic, FolderOpen } from 'lucide-react'
import type { AdminBatchFolder, BatchIntakePath } from '@/types/pathB'
import { STUDIO_DRIVE_READER_EMAIL } from '@/lib/studioDrive'
import { useTheme } from '@/theme'
import { useIdeasMutations } from '@/hooks/api/pathB/useIdeasMutations'
import {
  toIntakePath,
  useSubmitBatchIntakeMutation,
} from '@/hooks/api/pathB/useSubmitBatchIntakeMutation'

type Props = {
  batch: AdminBatchFolder
}

type IntakeChoice = BatchIntakePath | 'idea_first'

export function ClientBatchIntakeCard({ batch }: Props) {
  const { theme } = useTheme()
  const intakeMutation = useSubmitBatchIntakeMutation(batch.id)
  const { requestIdeas } = useIdeasMutations(batch.id)
  const [path, setPath] = useState<IntakeChoice>(
    batch.intakePath ?? 'source_media',
  )
  const [url, setUrl] = useState(
    batch.intakePath === 'clips_ready'
      ? (batch.clipsFolderUrl ?? '')
      : (batch.sourceMediaUrl ?? batch.footageUrl ?? ''),
  )
  const [expanded, setExpanded] = useState(true)

  const primary = theme.colors.primary
  /** Client-submitted intake only (admin-only footageUrl does not count). */
  const submitted =
    batch.intakePath === 'clips_ready'
      ? Boolean(batch.clipsFolderUrl?.trim())
      : batch.intakePath === 'source_media'
        ? Boolean(batch.sourceMediaUrl?.trim())
        : false

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (path === 'idea_first') return
    const trimmed = url.trim()
    if (!trimmed || intakeMutation.isPending) return
    intakeMutation.mutate({
      intakePath: toIntakePath(path),
      url: trimmed,
    })
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
                  Paste a Google Drive folder link — we skip the clip-finding step
                  and go straight to editing (no clip review round in Studio).
                </span>
              </span>
            </label>
            <label className="border-border hover:border-primary/30 flex cursor-pointer items-start gap-2 rounded-lg border p-2.5">
              <input
                type="radio"
                name={`intake-path-${batch.id}`}
                checked={path === 'idea_first'}
                onChange={() => {
                  setPath('idea_first')
                }}
                className="mt-0.5"
              />
              <span className="text-xs leading-snug">
                <span className="text-foreground font-semibold">
                  I need ideas first
                </span>
                <span className="text-muted-foreground block">
                  No footage yet — your SMM researches video ideas, you approve the
                  list, then you record and send footage.
                </span>
              </span>
            </label>
          </fieldset>

          {path === 'clips_ready' && (
            <div
              className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-xs leading-snug"
              role="status"
            >
              <p className="text-foreground font-semibold">
                Share your Drive folder with our reader account
              </p>
              <p className="text-muted-foreground mt-1">
                Add this email as a <strong className="text-foreground">Viewer</strong>{' '}
                on the folder (or parent) so we can list files and show previews in
                Studio:
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="bg-background/80 border-border text-foreground max-w-full break-all rounded border px-2 py-1 font-mono text-[11px]">
                  {STUDIO_DRIVE_READER_EMAIL}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(STUDIO_DRIVE_READER_EMAIL)
                  }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                >
                  <Copy className="size-3" aria-hidden />
                  Copy
                </button>
              </div>
            </div>
          )}

          {path === 'idea_first' ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-2.5">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0" style={{ color: primary }} aria-hidden />
                <p className="text-muted-foreground text-[10px] leading-snug">
                  We'll notify your SMM to start researching ideas. You'll review the list here
                  before recording anything.
                </p>
              </div>
              <button
                type="button"
                disabled={requestIdeas.isPending}
                onClick={() => {
                  requestIdeas.mutate()
                }}
                className="bg-primary text-primary-foreground disabled:opacity-50 w-full rounded-lg py-1.5 text-xs font-semibold"
              >
                {requestIdeas.isPending ? 'Requesting…' : 'Request ideas'}
              </button>
            </div>
          ) : (
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
            {intakeMutation.isError && (
              <p className="text-destructive text-[10px] leading-snug" role="alert">
                Could not submit intake. Check the link and try again.
              </p>
            )}
            <button
              type="submit"
              disabled={!url.trim() || intakeMutation.isPending}
              className="bg-primary text-primary-foreground disabled:opacity-50 w-full rounded-lg py-1.5 text-xs font-semibold"
            >
              {intakeMutation.isPending
                ? 'Submitting…'
                : submitted
                  ? 'Update link'
                  : 'Submit link'}
            </button>
          </form>
          )}
        </div>
      )}
    </div>
  )
}
