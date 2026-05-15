import { useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { FinalReviewMock } from '@mockData/index'
import type { AppTheme } from '@/theme/types'

type ClientFinalReviewPanelProps = {
  mock: FinalReviewMock
  theme: AppTheme
  onApprove?: () => void
  onReject?: () => void
}

export function ClientFinalReviewPanel({
  mock,
  theme,
  onApprove,
  onReject,
}: ClientFinalReviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [generalNote, setGeneralNote] = useState('')
  const [atTimeNote, setAtTimeNote] = useState('')
  const [markers, setMarkers] = useState<{ at: number; text: string }[]>([])
  const [savedGeneral, setSavedGeneral] = useState('')

  const primary = theme.colors.primary
  const accent = theme.colors.accent

  function addTimestampedComment() {
    const el = videoRef.current
    if (!el || !atTimeNote.trim()) return
    const t = el.currentTime
    setMarkers((prev) => [...prev, { at: t, text: atTimeNote.trim() }])
    setAtTimeNote('')
  }

  function saveGeneralNote() {
    if (!generalNote.trim()) return
    setSavedGeneral(generalNote.trim())
    setGeneralNote('')
  }

  function formatTs(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const hasComments = markers.length > 0 || Boolean(savedGeneral)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="text-muted-foreground shrink-0 pb-4 text-center text-sm leading-relaxed">
        Watch the finished video below. Pause at any moment to add timestamped feedback on the
        right, or add general notes. Your saved comments appear under the video. Approve when
        you&apos;re happy, or request changes.
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-6 pb-2 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            <div
              className="bg-muted/40 border-border overflow-hidden rounded-xl border"
              style={{ boxShadow: `0 12px 40px -12px ${primary}22` }}
            >
              <video
                ref={videoRef}
                className="aspect-video w-full max-h-[min(42vh,420px)] bg-black object-contain"
                controls
                playsInline
                preload="metadata"
                src={mock.videoSrc}
              />
            </div>

            {hasComments && (
              <div className="border-border bg-muted/20 max-h-[min(28vh,240px)] space-y-3 overflow-y-auto rounded-xl border p-4 text-left">
                <p className="text-foreground sticky top-0 bg-[var(--muted)]/80 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
                  Your comments
                </p>
                {markers.length > 0 && (
                  <ul className="space-y-2 text-sm">
                    {markers.map((m, i) => (
                      <li key={`${m.at}-${i}`} className="text-foreground/90 leading-snug">
                        <span className="font-mono font-semibold" style={{ color: accent }}>
                          {formatTs(m.at)}
                        </span>{' '}
                        — {m.text}
                      </li>
                    ))}
                  </ul>
                )}
                {savedGeneral && (
                  <p className="text-foreground/90 border-border border-t pt-2 text-sm leading-snug">
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                      General —{' '}
                    </span>
                    {savedGeneral}
                  </p>
                )}
              </div>
            )}
          </div>

          <aside className="border-border w-full shrink-0 space-y-4 lg:w-72 lg:border-l lg:pl-6">
            <div>
              <label
                htmlFor="ts-feedback"
                className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em]"
              >
                Feedback at playhead
              </label>
              <textarea
                id="ts-feedback"
                value={atTimeNote}
                onChange={(e) => {
                  setAtTimeNote(e.target.value)
                }}
                rows={3}
                placeholder="Pause the video where it matters, then describe the fix…"
                className="border-border bg-background/90 text-foreground placeholder:text-muted-foreground/70 w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
              <button
                type="button"
                onClick={addTimestampedComment}
                className="bg-primary text-primary-foreground hover:brightness-[1.03] mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl text-sm font-semibold"
              >
                Add comment at current time
              </button>
            </div>

            <div>
              <label
                htmlFor="general-feedback"
                className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em]"
              >
                General feedback
              </label>
              <textarea
                id="general-feedback"
                value={generalNote}
                onChange={(e) => {
                  setGeneralNote(e.target.value)
                }}
                rows={4}
                placeholder="Overall notes not tied to a single moment…"
                className="border-border bg-background/90 text-foreground placeholder:text-muted-foreground/70 w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
              <button
                type="button"
                onClick={saveGeneralNote}
                disabled={!generalNote.trim()}
                className="border-border text-foreground hover:bg-muted/50 mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl border text-sm font-semibold disabled:opacity-50"
              >
                Add general comment
              </button>
            </div>
          </aside>
        </div>
      </div>

      {(onApprove || onReject) && (
        <footer className="border-border bg-background mt-4 flex shrink-0 justify-center gap-3 border-t pt-5">
          {onApprove && (
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex min-w-[160px] items-center justify-center gap-1.5 rounded-xl bg-[var(--success)] px-6 py-2.5 text-sm font-semibold text-white"
            >
              <Check className="size-4" aria-hidden />
              Approve
            </button>
          )}
          {onReject && (
            <button
              type="button"
              onClick={onReject}
              className="border-border text-foreground hover:bg-muted/60 inline-flex min-w-[160px] items-center justify-center gap-1.5 rounded-xl border px-6 py-2.5 text-sm font-semibold"
            >
              <X className="size-4" aria-hidden />
              Request changes
            </button>
          )}
        </footer>
      )}
    </div>
  )
}
