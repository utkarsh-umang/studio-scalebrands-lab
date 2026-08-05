import { useState } from 'react'
import { Copy, Lightbulb, Link2, Mic, FolderOpen } from 'lucide-react'
import type { AdminBatchFolder, BatchIntakePath } from '@/types/pathB'
import { STUDIO_DRIVE_READER_EMAIL } from '@/lib/studioDrive'
import { apiErrorMessage } from '@/lib/apiError'
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

  // Same trap as the thumbnails card: the board swaps `batch` without
  // remounting, so state seeded at mount would carry one batch's link into the
  // next. Re-seed during render when the batch changes.
  const [prevBatchId, setPrevBatchId] = useState(batch.id)
  if (batch.id !== prevBatchId) {
    setPrevBatchId(batch.id)
    const nextPath = batch.intakePath ?? 'source_media'
    setPath(nextPath)
    setUrl(
      nextPath === 'clips_ready'
        ? (batch.clipsFolderUrl ?? '')
        : (batch.sourceMediaUrl ?? batch.footageUrl ?? ''),
    )
  }

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
      className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-6"
    >
      <button
        type="button"
        onClick={() => {
          setExpanded((v) => !v)
        }}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {path === 'clips_ready' ? (
            <FolderOpen className="size-4.5" aria-hidden />
          ) : (
            <Mic className="size-4.5" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
            Batch kickoff
          </span>
          <span className="text-foreground mt-1 block text-base font-semibold">
            {submitted ? 'Batch kickoff submitted' : 'Start this batch'}
          </span>
          <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
            Choose the starting point that best matches what you have ready today.
          </span>
        </span>
      </button>

      {expanded && (
        <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
          <fieldset>
            <legend className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              How are you starting?
            </legend>
            <div className="grid gap-3 md:grid-cols-3">
            <label
              className={[
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all',
                path === 'source_media'
                  ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-100'
                  : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50',
              ].join(' ')}
            >
              <input
                type="radio"
                name={`intake-path-${batch.id}`}
                checked={path === 'source_media'}
                onChange={() => {
                  setPath('source_media')
                  setUrl(batch.sourceMediaUrl ?? batch.footageUrl ?? '')
                }}
                className="mt-1 accent-blue-600"
              />
              <span className="text-xs leading-relaxed">
                <span className="text-foreground font-semibold">
                  Podcast or raw footage
                </span>
                <span className="text-muted-foreground mt-1 block text-[11px]">
                  Share the long-form source. We&apos;ll identify the best clips.
                </span>
              </span>
            </label>
            <label
              className={[
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all',
                path === 'clips_ready'
                  ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-100'
                  : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50',
              ].join(' ')}
            >
              <input
                type="radio"
                name={`intake-path-${batch.id}`}
                checked={path === 'clips_ready'}
                onChange={() => {
                  setPath('clips_ready')
                  setUrl(batch.clipsFolderUrl ?? '')
                }}
                className="mt-1 accent-blue-600"
              />
              <span className="text-xs leading-relaxed">
                <span className="text-foreground font-semibold">
                  I already have a clips folder
                </span>
                <span className="text-muted-foreground mt-1 block text-[11px]">
                  Share numbered clips and go straight into production.
                </span>
              </span>
            </label>
            <label
              className={[
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all',
                path === 'idea_first'
                  ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-100'
                  : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50',
              ].join(' ')}
            >
              <input
                type="radio"
                name={`intake-path-${batch.id}`}
                checked={path === 'idea_first'}
                onChange={() => {
                  setPath('idea_first')
                }}
                className="mt-1 accent-blue-600"
              />
              <span className="text-xs leading-relaxed">
                <span className="text-foreground font-semibold">
                  I need ideas first
                </span>
                <span className="text-muted-foreground mt-1 block text-[11px]">
                  We&apos;ll research ideas for you to approve before recording.
                </span>
              </span>
            </label>
            </div>
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
              <p className="text-muted-foreground mt-2">
                We&apos;ll verify access before continuing. Every video file in the folder
                becomes one clip in this batch; non-video files are ignored.
              </p>
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
                className="bg-primary text-primary-foreground w-full rounded-xl py-2.5 text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {requestIdeas.isPending ? 'Requesting…' : 'Request ideas'}
              </button>
            </div>
          ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
          >
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
              className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <p className="text-muted-foreground text-[10px] leading-snug">
              Links only — we do not accept file uploads in Studio.
            </p>
            {intakeMutation.isError && (
              <p className="text-destructive text-[10px] leading-snug" role="alert">
                {apiErrorMessage(
                  intakeMutation.error,
                  'Could not validate this folder. Check the link and try again.',
                )}
              </p>
            )}
            <button
              type="submit"
              disabled={!url.trim() || intakeMutation.isPending}
              className="bg-primary text-primary-foreground w-full rounded-xl py-2.5 text-xs font-semibold shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {intakeMutation.isPending
                ? path === 'clips_ready'
                  ? 'Checking folder access…'
                  : 'Submitting…'
                : submitted
                  ? 'Update link'
                  : path === 'clips_ready'
                    ? 'Validate and submit folder'
                    : 'Submit link'}
            </button>
          </form>
          )}
        </div>
      )}
    </div>
  )
}
