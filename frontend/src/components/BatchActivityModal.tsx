import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Flag,
  PartyPopper,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { StudioModalShell } from '@/components/StudioModalShell'
import type { BatchActivityItem } from '@/client'
import { useBatchActivityQuery } from '@/hooks/api/activity/useBatchActivityQuery'

type Props = {
  batchId: string | null
  batchTitle?: string
  open: boolean
  onClose: () => void
}

type Tone = 'positive' | 'negative' | 'neutral'

const ACTION_META: Record<string, { icon: LucideIcon; tone: Tone }> = {
  intake_submitted: { icon: CircleDot, tone: 'neutral' },
  clips_submitted_for_review: { icon: CircleDot, tone: 'neutral' },
  deliverables_submitted: { icon: CircleDot, tone: 'neutral' },
  clips_approved: { icon: CheckCircle2, tone: 'positive' },
  clips_rejected: { icon: XCircle, tone: 'negative' },
  smm_qa_approved: { icon: CheckCircle2, tone: 'positive' },
  smm_qa_flagged: { icon: Flag, tone: 'negative' },
  editor_resubmitted: { icon: RotateCcw, tone: 'neutral' },
  client_qa_approved: { icon: CheckCircle2, tone: 'positive' },
  client_qa_rejected: { icon: XCircle, tone: 'negative' },
  video_scheduled: { icon: CalendarClock, tone: 'positive' },
  batch_completed: { icon: PartyPopper, tone: 'positive' },
}

const TONE_CLASS: Record<Tone, string> = {
  positive: 'text-emerald-600',
  negative: 'text-destructive',
  neutral: 'text-muted-foreground',
}

function formatAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function ActivityRow({ item }: { item: BatchActivityItem }) {
  const meta = ACTION_META[item.action] ?? { icon: CircleDot, tone: 'neutral' as Tone }
  const Icon = meta.icon
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <Icon className={`size-4 shrink-0 ${TONE_CLASS[meta.tone]}`} aria-hidden />
        <span className="bg-border mt-1 w-px flex-1" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <p className="text-foreground text-sm font-medium leading-snug">{item.summary}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          <span className="capitalize">{item.actorName}</span> ({item.actorRole}) ·{' '}
          {formatAt(item.at)}
        </p>
        {item.detail ? (
          <p className="text-muted-foreground border-border mt-1.5 border-l-2 pl-2 text-xs italic">
            “{item.detail}”
          </p>
        ) : null}
      </div>
    </li>
  )
}

export function BatchActivityModal({ batchId, batchTitle, open, onClose }: Props) {
  const { data, isLoading, isError } = useBatchActivityQuery(batchId, open)
  const items = data?.items ?? []

  if (!open || !batchId) return null

  return (
    <StudioModalShell
      title="Activity"
      subtitle={batchTitle ? `${batchTitle} · history` : 'Batch history'}
      titleId="batch-activity-title"
      onClose={onClose}
    >
      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Loading history…</p>
      ) : isError ? (
        <p className="text-destructive py-8 text-center text-sm">Could not load activity.</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No decisions recorded yet. Approvals, rejections, QA, and scheduling will appear here.
        </p>
      ) : (
        <ul className="pt-1">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </StudioModalShell>
  )
}
