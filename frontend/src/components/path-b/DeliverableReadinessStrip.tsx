import { Check } from 'lucide-react'

type Props = {
  videoReady: boolean
  thumbnailReady: boolean
  titleReady: boolean
  /** When false, checklist is hidden (status shown on deliverable accordions). */
  showChecklist?: boolean
  ctaLabel?: string
  onCta?: () => void
  ctaDisabled?: boolean
  className?: string
}

function CheckItem({ label, ready }: { label: string; ready: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-xs font-medium',
        ready ? 'text-[var(--success)]' : 'text-muted-foreground',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex size-5 items-center justify-center rounded-full border',
          ready
            ? 'border-[var(--success)]/40 bg-[var(--success)]/15'
            : 'border-border bg-muted/30',
        ].join(' ')}
        aria-hidden
      >
        {ready ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      {label}
    </span>
  )
}

export function DeliverableReadinessStrip({
  videoReady,
  thumbnailReady,
  titleReady,
  showChecklist = true,
  ctaLabel = 'Send to SMM QA',
  onCta,
  ctaDisabled = false,
  className = '',
}: Props) {
  const allReady = videoReady && thumbnailReady && titleReady

  if (!showChecklist && !onCta) return null

  return (
    <div
      className={[
        'border-border bg-muted/15 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      ].join(' ')}
    >
      {showChecklist ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <CheckItem label="Video" ready={videoReady} />
          <CheckItem label="Thumbnail" ready={thumbnailReady} />
          <CheckItem label="Title" ready={titleReady} />
        </div>
      ) : (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {allReady
            ? 'All deliverables are ready — you can send this video to the next step.'
            : 'Expand missing sections above, upload to Drive, sync, then continue.'}
        </p>
      )}
      {onCta ? (
        <button
          type="button"
          onClick={onCta}
          disabled={!allReady || ctaDisabled}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  )
}
