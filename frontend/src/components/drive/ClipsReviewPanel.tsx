import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { DriveVideoPreview } from '@/components/drive/DriveVideoPreview'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import { getManifestForBatch } from '@/lib/driveMedia'

type Props = {
  batchId: string
  /** When omitted, reads latest from the bundled manifest map. */
  manifest?: BatchDriveManifest | undefined
  clipsFolderUrl: string
  /** Browse-only: clip list + preview, no approve/reject footer. */
  readOnly?: boolean
  /** Default: list on the right. */
  sidebarPosition?: 'left' | 'right'
  /** Fill parent height (numbered clips modal). */
  className?: string
  /** Routed workspace: keep the clip rail independently scrollable and content-height. */
  pageLayout?: boolean
  onApprove?: () => void
  onReject?: (note: string) => void
}

export function ClipsReviewPanel({
  batchId,
  manifest: manifestProp,
  clipsFolderUrl,
  readOnly = false,
  sidebarPosition = 'right',
  className = '',
  pageLayout = false,
  onApprove,
  onReject,
}: Props) {
  const manifest = manifestProp ?? getManifestForBatch(batchId)
  const clips = useMemo(() => manifest?.clips ?? [], [manifest])
  const [selectedIndex, setSelectedIndex] = useState(1)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [problemIndices, setProblemIndices] = useState<Set<number>>(new Set())

  const resolvedSelected =
    clips.length === 0
      ? null
      : clips.some((c) => c.index === selectedIndex)
        ? selectedIndex
        : clips[0].index

  const selected =
    resolvedSelected === null
      ? undefined
      : clips.find((c) => c.index === resolvedSelected)

  function toggleProblem(index: number) {
    setProblemIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function resetRejectMode() {
    setRejectMode(false)
    setRejectNote('')
    setProblemIndices(new Set())
  }

  const sortedProblems = useMemo(
    () => [...problemIndices].sort((a, b) => a - b),
    [problemIndices],
  )

  const rejectValid =
    sortedProblems.length >= 1 && rejectNote.trim().length > 0

  function submitReject() {
    const header = `Clips needing replacement: ${sortedProblems.join(', ')}.`
    onReject?.(`${header}\n\n${rejectNote.trim()}`)
  }

  return (
    <div
      className={[
        pageLayout
          ? 'flex min-h-0 flex-col overflow-visible'
          : 'flex min-h-0 flex-1 flex-col overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {manifest && manifest.unmapped.length > 0 && (
        <ul className="text-destructive/90 mb-3 max-h-20 shrink-0 overflow-y-auto text-left text-[11px]">
          {manifest.unmapped.map((u) => (
            <li key={`${u.name}-${u.reason}`}>
              <span className="font-medium">{u.name}</span>: {u.reason}
            </li>
          ))}
        </ul>
      )}

      <div
        className={[
          pageLayout
            ? 'flex min-h-0 flex-col gap-4 overflow-visible lg:items-start'
            : 'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:min-h-[280px] md:gap-4',
          sidebarPosition === 'right'
            ? pageLayout
              ? 'lg:flex-row-reverse'
              : 'md:flex-row-reverse'
            : pageLayout
              ? 'lg:flex-row'
              : 'md:flex-row',
        ].join(' ')}
      >
        <aside
          className={[
            'flex min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80',
            pageLayout
              ? 'h-[220px] w-full lg:h-[360px] lg:w-56 lg:self-start xl:h-[440px]'
              : 'h-[min(36vh,260px)] md:h-auto md:w-64 md:self-stretch',
          ].join(' ')}
          aria-label="Clip list"
        >
          <div className="shrink-0 border-b border-slate-200 bg-white/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-900">Clip set</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                {clips.length} total
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              {rejectMode
                ? 'Select every clip that needs a replacement.'
                : 'Choose a clip to review its full cut.'}
            </p>
          </div>
          <ul
            className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-y-contain p-2.5"
            role="listbox"
            aria-label="Numbered clips"
          >
            {clips.map((c) => {
              const active = resolvedSelected !== null && c.index === resolvedSelected
              return (
                <li key={c.driveFileId}>
                  <div
                    className={[
                      'flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs transition-all',
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-950 shadow-sm'
                        : 'border-transparent bg-white/70 text-slate-700 hover:border-slate-200 hover:bg-white',
                    ].join(' ')}
                  >
                    {rejectMode && (
                      <input
                        type="checkbox"
                        checked={problemIndices.has(c.index)}
                        onChange={() => {
                          toggleProblem(c.index)
                        }}
                        className="border-border shrink-0 rounded"
                        aria-label={`Clip ${c.index} needs replacement`}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIndex(c.index)
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left font-medium leading-snug"
                    >
                      <span
                        className={[
                          'flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tabular-nums',
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500',
                        ].join(' ')}
                      >
                        {c.index}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">Clip {c.index}</span>
                        <span
                          className={[
                            'mt-0.5 line-clamp-2 block text-[10px] font-normal',
                            active ? 'text-blue-700' : 'text-slate-500',
                          ].join(' ')}
                        >
                          {c.name}
                        </span>
                      </span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </aside>

        <main
          className={[
            'flex min-h-0 min-w-0 flex-1 flex-col',
            pageLayout ? 'w-full overflow-visible' : 'overflow-hidden md:min-h-0',
          ].join(' ')}
        >
          {selected ? (
            <div
              className={[
                'flex min-h-0 flex-col',
                pageLayout
                  ? 'overflow-visible'
                  : 'flex-1 overflow-y-auto overscroll-y-contain',
              ].join(' ')}
            >
              <div className="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-2 px-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                    Reviewing clip {selected.index}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{selected.name}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                  {clips.findIndex((clip) => clip.index === selected.index) + 1} of {clips.length}
                </span>
              </div>
              <div className="min-h-0 shrink-0 rounded-2xl bg-slate-950 p-2 shadow-inner md:p-3">
                <DriveVideoPreview
                  driveFileId={selected.driveFileId}
                  fileName={selected.name}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6">
              <p className="max-w-md text-center text-sm leading-relaxed text-slate-500">
              No clips in the manifest yet. Use <strong className="text-foreground">Sync with Drive</strong>{' '}
              in the header, or add files to{' '}
              <a
                href={clipsFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium underline"
              >
                the clips folder
              </a>
              .
              </p>
            </div>
          )}
        </main>
      </div>

      {readOnly ? null : (
        <footer className="mt-4 shrink-0 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          {!rejectMode ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <p className="flex-1 text-xs leading-relaxed text-slate-500 sm:min-w-0">
                Your approval moves the whole set into production. If something is off, mark only
                the affected clips and add one clear note for the team.
              </p>
              <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRejectMode(true)
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 sm:min-w-[140px]"
                >
                  <X className="size-4" aria-hidden />
                  Reject clips…
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApprove?.()
                  }}
                  disabled={clips.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 sm:min-w-[180px]"
                >
                  <Check className="size-4" aria-hidden />
                  Approve all clips
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label
                htmlFor="clip-reject-detail"
                className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wide"
              >
                What should change for each clip you marked?
              </label>
              <textarea
                id="clip-reject-detail"
                value={rejectNote}
                onChange={(e) => {
                  setRejectNote(e.target.value)
                }}
                rows={4}
                placeholder='e.g. Clip 2 — wrong segment; Clip 5 — needs tighter hook before 0:08.'
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-100"
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={resetRejectMode}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectValid}
                  onClick={submitReject}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Send rejection to SMM
                </button>
              </div>
            </div>
          )}
        </footer>
      )}
    </div>
  )
}
