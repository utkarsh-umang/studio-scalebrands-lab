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
  onApprove: () => void
  onReject: (note: string) => void
}

export function ClientClipReviewPanel({
  batchId,
  manifest: manifestProp,
  clipsFolderUrl,
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
    onReject(`${header}\n\n${rejectNote.trim()}`)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {manifest && manifest.unmapped.length > 0 && (
        <ul className="text-destructive/90 mb-3 max-h-20 shrink-0 overflow-y-auto text-left text-[11px]">
          {manifest.unmapped.map((u) => (
            <li key={`${u.name}-${u.reason}`}>
              <span className="font-medium">{u.name}</span>: {u.reason}
            </li>
          ))}
        </ul>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row md:gap-4">
        <aside className="border-border bg-muted/15 flex max-h-[min(28vh,220px)] shrink-0 flex-col rounded-xl border md:max-h-none md:w-56 md:bg-transparent">
          {rejectMode ? (
            <p className="text-muted-foreground border-border shrink-0 border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wide md:border-0 md:px-0 md:pb-2 md:pt-2">
              Mark clips to replace
            </p>
          ) : null}
          <ul
            className={[
              'min-h-0 flex-1 space-y-1 overflow-y-auto p-2 md:px-0 md:pb-0',
              rejectMode ? '' : 'md:pt-0',
            ].join(' ')}
          >
            {clips.map((c) => {
              const active = resolvedSelected !== null && c.index === resolvedSelected
              return (
                <li key={c.driveFileId}>
                  <div
                    className={[
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 hover:bg-muted/50 text-foreground',
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
                      className="min-w-0 flex-1 text-left font-medium leading-snug"
                    >
                      <span className="tabular-nums">Clip {c.index}</span>
                      <span
                        className={[
                          'mt-0.5 line-clamp-2 block font-normal opacity-90',
                          active ? 'text-primary-foreground/90' : 'text-muted-foreground',
                        ].join(' ')}
                      >
                        {c.name}
                      </span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto pr-1">
          {selected ? (
            <div className="space-y-3">
              <p className="text-foreground text-sm font-semibold">{selected.name}</p>
              <DriveVideoPreview driveFileId={selected.driveFileId} fileName={selected.name} />
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-sm md:text-left">
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
          )}
        </main>
      </div>

      <footer className="border-border mt-4 shrink-0 space-y-3 border-t pt-4">
        {!rejectMode ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <p className="text-muted-foreground flex-1 text-xs leading-relaxed sm:min-w-0">
              Watch each clip from the list. Approve the full set when everything looks right, or
              reject and tell us exactly which clip numbers need a new cut — our SMM will source
              replacements for those slots only.
            </p>
            <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setRejectMode(true)
                }}
                className="border-border text-destructive hover:bg-destructive/5 inline-flex items-center justify-center gap-1.5 rounded-xl border px-5 py-2.5 text-sm font-semibold sm:min-w-[140px]"
              >
                <X className="size-4" aria-hidden />
                Reject clips…
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={clips.length === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--success)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:min-w-[180px]"
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
              className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={resetRejectMode}
                className="border-border hover:bg-muted/40 rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectValid}
                onClick={submitReject}
                className="bg-destructive inline-flex items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Send rejection to SMM
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  )
}
