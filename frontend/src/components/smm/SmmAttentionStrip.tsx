import { CalendarClock, FolderOpen, MessageSquareWarning, ScanEye, Scissors } from 'lucide-react'
import type { SmmAttentionItem } from '@/lib/smmBoard'
import { useTheme } from '@/theme'

type Props = {
  items: SmmAttentionItem[]
  onOpen: (item: SmmAttentionItem) => void
}

function itemLabel(item: SmmAttentionItem): string {
  switch (item.kind) {
    case 'find_clips':
      return 'Find clips'
    case 'view_clips':
      return 'View clips folder'
    case 'video_qa':
      return item.count && item.count > 1 ? `Video QA (${item.count})` : 'Video QA'
    case 'client_revision':
      return item.count && item.count > 1
        ? `Client revisions (${item.count})`
        : 'Client revisions'
    case 'schedule':
      return 'Schedule batch'
    default:
      return 'Action needed'
  }
}

function ItemIcon({
  kind,
  color,
}: {
  kind: SmmAttentionItem['kind']
  color: string
}) {
  const className = 'size-3.5 shrink-0'
  const style = { color }
  switch (kind) {
    case 'find_clips':
      return <Scissors className={className} style={style} aria-hidden />
    case 'view_clips':
      return <FolderOpen className={className} style={style} aria-hidden />
    case 'video_qa':
      return <ScanEye className={className} style={style} aria-hidden />
    case 'client_revision':
      return <MessageSquareWarning className={className} style={style} aria-hidden />
    case 'schedule':
      return <CalendarClock className={className} style={style} aria-hidden />
    default:
      return null
  }
}

export function SmmAttentionStrip({ items, onOpen }: Props) {
  const { theme } = useTheme()

  if (items.length === 0) return null

  return (
    <section
      className="border-border bg-background/90 rounded-xl border p-3 backdrop-blur-sm"
      style={{ boxShadow: `0 0 0 1px ${theme.colors.primary}12 inset` }}
    >
      <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
        Needs you
      </p>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {items.map((item) => (
          <li key={`${item.batchId}-${item.kind}-${item.videoId ?? ''}`}>
            <button
              type="button"
              onClick={() => {
                onOpen(item)
              }}
              className="border-border hover:border-primary/35 bg-muted/30 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors sm:w-auto"
            >
              <ItemIcon kind={item.kind} color={theme.colors.primary} />
              <span className="min-w-0">
                <span className="text-foreground block font-semibold">
                  {itemLabel(item)}
                </span>
                <span className="text-muted-foreground block truncate text-[10px]">
                  {item.clientName} · {item.batchTitle}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
