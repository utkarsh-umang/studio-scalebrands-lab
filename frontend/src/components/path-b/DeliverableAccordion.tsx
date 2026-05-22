import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

export type DeliverableAccordionStatus = 'ready' | 'missing' | 'info'

type Props = {
  id: string
  title: string
  status?: DeliverableAccordionStatus
  statusLabel?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Actions visible in the header (e.g. Sync) — stay reachable when collapsed */
  headerAside?: ReactNode
  children: ReactNode
  className?: string
}

function StatusChip({
  status,
  label,
}: {
  status: DeliverableAccordionStatus
  label?: string
}) {
  const resolved =
    label ??
    (status === 'ready' ? 'Ready' : status === 'missing' ? 'Missing' : 'Info')

  return (
    <span
      className={[
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        status === 'ready' && 'bg-[var(--success)]/15 text-[var(--success)]',
        status === 'missing' &&
          'bg-destructive/10 text-destructive border-destructive/25 border',
        status === 'info' && 'bg-muted/50 text-muted-foreground border-border border',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {resolved}
    </span>
  )
}

export function DeliverableAccordion({
  id,
  title,
  status,
  statusLabel,
  open,
  onOpenChange,
  headerAside,
  children,
  className = '',
}: Props) {
  const panelId = `${id}-panel`
  const headerId = `${id}-header`

  return (
    <div
      className={[
        'border-border border-b last:border-b-0',
        className,
      ].join(' ')}
    >
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            onOpenChange(!open)
          }}
          className="hover:bg-muted/30 flex min-w-0 flex-1 items-center gap-2 rounded-t-lg px-4 py-3 text-left transition-colors"
        >
          <ChevronDown
            className={[
              'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0',
            ].join(' ')}
            aria-hidden
          />
          <span className="text-foreground min-w-0 flex-1 text-sm font-semibold">
            {title}
          </span>
          {status ? <StatusChip status={status} label={statusLabel} /> : null}
        </button>
        {headerAside ? (
          <div className="flex shrink-0 items-center gap-2 self-center pr-3">
            {headerAside}
          </div>
        ) : null}
      </div>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="border-border bg-background/60 border-t px-4 pb-4 pt-3"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
