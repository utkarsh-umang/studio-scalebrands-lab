import { Clock } from 'lucide-react'

type Props = {
  deadlineAt?: string | null
  className?: string
}

type DeadlineStatus = 'overdue' | 'soon' | 'upcoming'

/** Bucket a deadline relative to now, with a short human label. */
function classifyDeadline(deadlineAt: string): {
  status: DeadlineStatus
  label: string
} {
  const due = new Date(deadlineAt).getTime()
  const diffMs = due - Date.now()
  const hours = Math.abs(diffMs) / 3_600_000

  if (diffMs < 0) {
    const days = Math.floor(hours / 24)
    return {
      status: 'overdue',
      label: days >= 1 ? `Overdue ${days}d` : `Overdue ${Math.max(1, Math.round(hours))}h`,
    }
  }
  if (hours <= 24) {
    return { status: 'soon', label: `Due in ${Math.max(1, Math.round(hours))}h` }
  }
  const days = Math.round(hours / 24)
  if (days <= 3) return { status: 'upcoming', label: `Due in ${days}d` }
  return {
    status: 'upcoming',
    label: `Due ${new Date(deadlineAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`,
  }
}

const STATUS_CLASS: Record<DeadlineStatus, string> = {
  overdue: 'border-destructive/30 bg-destructive/10 text-destructive',
  soon: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  upcoming: 'border-border bg-muted/40 text-muted-foreground',
}

export function DeadlineChip({ deadlineAt, className = '' }: Props) {
  if (!deadlineAt) return null
  const { status, label } = classifyDeadline(deadlineAt)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${STATUS_CLASS[status]} ${className}`}
      title={`Deadline: ${new Date(deadlineAt).toLocaleString()}`}
    >
      <Clock className="size-2.5" aria-hidden />
      {label}
    </span>
  )
}
