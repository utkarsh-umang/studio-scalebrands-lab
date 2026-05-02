import { useRef, useState } from 'react'
import { PlayCircle } from 'lucide-react'
import type { FinalReviewMock } from '@mockData/index'
import type { AppTheme } from '@/theme/types'

type ClientFinalReviewPanelProps = {
  mock: FinalReviewMock
  theme: AppTheme
}

export function ClientFinalReviewPanel({
  mock,
  theme,
}: ClientFinalReviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [generalNote, setGeneralNote] = useState('')
  const [atTimeNote, setAtTimeNote] = useState('')
  const [markers, setMarkers] = useState<{ at: number; text: string }[]>([])

  const primary = theme.colors.primary
  const secondary = theme.colors.secondary
  const accent = theme.colors.accent

  function addTimestampedComment() {
    const el = videoRef.current
    if (!el || !atTimeNote.trim()) return
    const t = el.currentTime
    setMarkers((prev) => [...prev, { at: t, text: atTimeNote.trim() }])
    setAtTimeNote('')
  }

  function formatTs(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <section
      className="border-border bg-background/85 overflow-hidden rounded-2xl border shadow-[0_24px_80px_-16px_rgba(5,9,14,0.12)] backdrop-blur-xl"
      style={{
        boxShadow: `
          0 24px 80px -16px rgba(5, 9, 14, 0.12),
          0 0 0 1px rgba(255, 255, 255, 0.55) inset
        `,
      }}
    >
      <div
        className="border-border/80 flex flex-col gap-1 border-b px-5 py-4 md:flex-row md:items-center md:justify-between"
        style={{
          background: `linear-gradient(135deg, ${primary}0d, ${secondary}0a)`,
        }}
      >
        <div className="flex items-center gap-2">
          <PlayCircle className="text-foreground size-5 shrink-0" aria-hidden />
          <div>
            <h3 className="text-foreground font-semibold">Final video review</h3>
            <p className="text-muted-foreground text-xs">{mock.batchTitle}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-[11px] md:text-xs">
          Pause, then add time-stamped notes or general feedback below (prototype).
        </p>
      </div>

      <div className="p-5">
        <div
          className="bg-muted/40 border-border relative overflow-hidden rounded-xl border"
          style={{
            boxShadow: `0 12px 40px -12px ${primary}22`,
          }}
        >
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black object-contain"
            controls
            playsInline
            preload="metadata"
            src={mock.videoSrc}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
              className="border-border bg-background/90 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/40 w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <button
              type="button"
              onClick={addTimestampedComment}
              className="bg-primary text-primary-foreground hover:brightness-[1.03] mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl text-sm font-semibold shadow-md transition-[filter] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none sm:w-auto sm:px-4"
              style={{ boxShadow: `0 8px 22px -6px ${primary}55` }}
            >
              Save comment at current time
            </button>
            {markers.length > 0 && (
              <ul className="border-border bg-code-bg mt-3 max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3 text-xs">
                {markers.map((m, i) => (
                  <li key={`${m.at}-${i}`} className="text-foreground/90 leading-snug">
                    <span
                      className="font-mono font-semibold"
                      style={{ color: accent }}
                    >
                      {formatTs(m.at)}
                    </span>{' '}
                    — {m.text}
                  </li>
                ))}
              </ul>
            )}
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
              rows={5}
              placeholder="Overall notes not tied to a single moment…"
              className="border-border bg-background/90 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/40 w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-transparent bg-[var(--success)] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-[1.05] sm:flex-none min-w-[140px]"
          >
            Approve
          </button>
          <button
            type="button"
            className="border-border text-foreground hover:bg-muted/60 inline-flex h-10 flex-1 items-center justify-center rounded-xl border bg-transparent px-4 text-sm font-semibold transition-colors sm:flex-none min-w-[160px]"
            style={{
              boxShadow: `0 0 0 1px ${secondary}44 inset`,
            }}
          >
            Request changes
          </button>
        </div>
        <p className="text-muted-foreground mt-3 text-[11px] leading-snug">
          Buttons are visual only in this prototype; feedback above is kept in the
          browser until you wire the API.
        </p>
      </div>
    </section>
  )
}
