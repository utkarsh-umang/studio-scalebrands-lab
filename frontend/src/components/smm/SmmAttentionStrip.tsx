import { CalendarClock, ScanEye, Scissors } from 'lucide-react'
import type { SmmBatchAttention } from '@/lib/smmBoard'
import { useTheme } from '@/theme'

type Props = {
  items: SmmBatchAttention[]
  onOpen: (item: SmmBatchAttention) => void
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
          <li key={`${item.batchId}-${item.kind}`}>
            <button
              type="button"
              onClick={() => {
                onOpen(item)
              }}
              className="border-border hover:border-primary/35 bg-muted/30 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors sm:w-auto"
            >
              {item.kind === 'find_clips' ? (
                <Scissors
                  className="size-3.5 shrink-0"
                  style={{ color: theme.colors.primary }}
                  aria-hidden
                />
              ) : item.kind === 'video_qa' ? (
                <ScanEye
                  className="size-3.5 shrink-0"
                  style={{ color: theme.colors.primary }}
                  aria-hidden
                />
              ) : (
                <CalendarClock
                  className="size-3.5 shrink-0"
                  style={{ color: theme.colors.primary }}
                  aria-hidden
                />
              )}
              <span className="min-w-0">
                <span className="text-foreground block font-semibold">
                  {item.kind === 'find_clips'
                    ? 'Find clips'
                    : item.kind === 'video_qa'
                      ? 'Video QA'
                      : 'Mark published'}
                </span>
                <span className="text-muted-foreground block truncate text-[10px]">
                  {item.clientName} ·{' '}
                  {item.batchTitle}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
