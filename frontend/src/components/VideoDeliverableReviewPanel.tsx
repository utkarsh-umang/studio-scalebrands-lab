import { useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import {
  DriveVideoPreview,
  type DriveVideoLayout,
} from '@/components/drive/DriveVideoPreview'
import {
  qaPortraitChromeClass,
  qaPortraitPlayerBoxClass,
  qaPortraitVideoInnerClass,
} from '@/lib/qaVideoPortrait'
import { parseTimeToSeconds } from '@/lib/timecode'
import type { AppTheme } from '@/theme/types'

export type VideoReviewMarker = { at: number; text: string }

export type VideoReviewFeedback = {
  markers: VideoReviewMarker[]
  generalNote: string
}

export type VideoDeliverableReviewPanelProps = {
  className?: string
  /** Direct video URL (fallback when no Drive file) */
  videoSrc?: string
  /** Google Drive file id — renders preview iframe */
  driveFileId?: string
  fileName?: string
  /** Vertical shorts (9:16) vs landscape — QA defaults to portrait. */
  videoLayout?: DriveVideoLayout
  introText: string
  theme: AppTheme
  commentsHeading?: string
  initialMarkers?: VideoReviewMarker[]
  initialGeneralNote?: string
  approveLabel?: string
  rejectLabel?: string
  disableApproveWhenHasComments?: boolean
  /** When true, reject/send-back is only enabled once comments exist */
  requireCommentsOnReject?: boolean
  onApprove?: () => void
  onReject?: (feedback: VideoReviewFeedback) => void
}

export function VideoDeliverableReviewPanel({
  className,
  videoSrc,
  driveFileId,
  fileName,
  videoLayout = 'portrait',
  introText,
  theme,
  commentsHeading = 'Your comments',
  initialMarkers = [],
  initialGeneralNote = '',
  approveLabel = 'Approve',
  rejectLabel = 'Request changes',
  disableApproveWhenHasComments = false,
  requireCommentsOnReject = false,
  onApprove,
  onReject,
}: VideoDeliverableReviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [generalNote, setGeneralNote] = useState('')
  const [atTimeNote, setAtTimeNote] = useState('')
  const [driveTimecode, setDriveTimecode] = useState('')
  const [timecodeError, setTimecodeError] = useState<string | null>(null)
  const [markers, setMarkers] = useState<VideoReviewMarker[]>(initialMarkers)
  const [savedGeneral, setSavedGeneral] = useState(initialGeneralNote)

  /** Drive `/preview` iframe — no programmatic playhead; timed comments use manual timecode. */
  const usingDrivePreview = Boolean(driveFileId)

  const primary = theme.colors.primary
  const accent = theme.colors.accent
  const landscapeVideoClass =
    'aspect-video w-full max-h-[min(42vh,420px)] bg-black object-contain object-center'

  function addTimestampedComment() {
    if (!atTimeNote.trim()) return
    let t: number | null = null
    if (usingDrivePreview) {
      t = parseTimeToSeconds(driveTimecode)
      if (t === null) {
        setTimecodeError('Enter a valid timecode (e.g. 0:12 or 1:05).')
        return
      }
    } else {
      const el = videoRef.current
      if (el) t = el.currentTime
    }
    if (t === null) return
    setMarkers((prev) => [...prev, { at: t, text: atTimeNote.trim() }])
    setAtTimeNote('')
    setDriveTimecode('')
    setTimecodeError(null)
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

  function collectFeedback(): VideoReviewFeedback {
    const general = [savedGeneral, generalNote.trim()].filter(Boolean).join('\n\n')
    return { markers, generalNote: general }
  }

  const hasComments =
    markers.length > 0 || Boolean(savedGeneral) || Boolean(generalNote.trim())
  const approveDisabled =
    disableApproveWhenHasComments && hasComments
  const rejectDisabled = requireCommentsOnReject && !hasComments

  const rootClass = ['flex min-h-0 min-w-0 flex-1 flex-col', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      {introText.trim() ? (
        <p className="text-muted-foreground shrink-0 pb-4 text-center text-sm leading-relaxed">
          {introText}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-6 pb-2 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-4 lg:min-w-[min(100%,480px)]">
            <div
              className={qaPortraitChromeClass}
              style={{ boxShadow: `0 12px 40px -12px ${primary}22` }}
            >
              {usingDrivePreview ? (
                <DriveVideoPreview
                  driveFileId={driveFileId!}
                  fileName={fileName}
                  layout={videoLayout}
                />
              ) : videoSrc ? (
                videoLayout === 'portrait' ? (
                  <div className={qaPortraitPlayerBoxClass} dir="ltr">
                    <video
                      ref={videoRef}
                      className={qaPortraitVideoInnerClass}
                      controls
                      playsInline
                      preload="metadata"
                      src={videoSrc}
                    />
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    className={landscapeVideoClass}
                    controls
                    playsInline
                    preload="metadata"
                    src={videoSrc}
                  />
                )
              ) : (
                <p className="text-muted-foreground p-8 text-center text-sm">
                  No video source configured.
                </p>
              )}
            </div>

            {hasComments && (
              <div className="border-border bg-muted/20 max-h-[min(28vh,240px)] space-y-3 overflow-y-auto rounded-xl border p-4 text-left">
                <p className="text-foreground sticky top-0 bg-[var(--muted)]/80 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
                  {commentsHeading}
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
              {usingDrivePreview ? (
                <div className="mb-3 space-y-1.5">
                  <label
                    htmlFor="drive-timecode"
                    className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-[0.12em]"
                  >
                    Timecode (Drive preview)
                  </label>
                  <input
                    id="drive-timecode"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={driveTimecode}
                    onChange={(e) => {
                      setDriveTimecode(e.target.value)
                      setTimecodeError(null)
                    }}
                    placeholder="e.g. 0:12 or 1:05"
                    className="border-border bg-background/90 text-foreground placeholder:text-muted-foreground/70 w-full rounded-xl border px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  />
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    The embedded player does not expose the playhead. Note the time from the
                    preview (or open in Drive), then attach your comment to that moment.
                  </p>
                </div>
              ) : null}
              <label
                htmlFor="ts-feedback"
                className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em]"
              >
                {usingDrivePreview ? 'Feedback at that time' : 'Feedback at playhead'}
              </label>
              <textarea
                id="ts-feedback"
                value={atTimeNote}
                onChange={(e) => {
                  setAtTimeNote(e.target.value)
                }}
                rows={3}
                placeholder={
                  usingDrivePreview
                    ? 'Describe what to fix at the timecode above…'
                    : 'Pause the video where it matters, then describe the fix…'
                }
                className="border-border bg-background/90 text-foreground placeholder:text-muted-foreground/70 w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
              {timecodeError ? (
                <p className="text-destructive mt-1.5 text-xs">{timecodeError}</p>
              ) : null}
              <button
                type="button"
                onClick={addTimestampedComment}
                className="bg-primary text-primary-foreground hover:brightness-[1.03] mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl text-sm font-semibold"
              >
                {usingDrivePreview ? 'Add timed comment' : 'Add comment at current time'}
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
              disabled={approveDisabled}
              onClick={onApprove}
              className="inline-flex min-w-[160px] items-center justify-center gap-1.5 rounded-xl bg-[var(--success)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Check className="size-4" aria-hidden />
              {approveLabel}
            </button>
          )}
          {onReject && (
            <button
              type="button"
              disabled={rejectDisabled}
              onClick={() => {
                onReject(collectFeedback())
              }}
              className="border-border text-foreground hover:bg-muted/60 inline-flex min-w-[160px] items-center justify-center gap-1.5 rounded-xl border px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              <X className="size-4" aria-hidden />
              {rejectLabel}
            </button>
          )}
        </footer>
      )}
    </div>
  )
}
