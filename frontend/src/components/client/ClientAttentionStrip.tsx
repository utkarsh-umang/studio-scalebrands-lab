import { AlertCircle, ChevronRight } from 'lucide-react'
import type { ClientAttentionItem, ClientReviewKind } from '@/lib/clientBoard'
import { useTheme } from '@/theme'

const reviewLabel: Record<ClientReviewKind, string> = {
  clip: 'Clip approval',
  final: 'Client QA',
}

type Props = {
  items: ClientAttentionItem[]
  onOpen: (videoId: string) => void
}

export function ClientAttentionStrip({ items, onOpen }: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  if (items.length === 0) {
    return (
      <div className="border-border bg-background/80 rounded-xl border px-4 py-3">
        <p className="text-muted-foreground text-sm">
          Nothing needs your approval right now — you&apos;re all caught up.
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertCircle
          className="size-5"
          style={{ color: theme.colors.destructive }}
          aria-hidden
        />
        <h2 className="text-foreground text-sm font-semibold">
          Needs your attention ({items.length})
        </h2>
      </div>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {items.map((item) => (
          <li key={item.videoId} className="min-w-0 flex-1 sm:max-w-[320px]">
            <button
              type="button"
              onClick={() => {
                onOpen(item.videoId)
              }}
              className="border-border bg-background/95 hover:border-primary/40 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              style={{
                borderColor: `${theme.colors.destructive}40`,
                boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.5) inset`,
              }}
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase"
                style={{
                  background: `${theme.colors.destructive}14`,
                  color: theme.colors.destructive,
                }}
              >
                !
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate text-sm font-medium">
                  {item.title}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {item.batchTitle} · {reviewLabel[item.reviewKind]}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0"
                style={{ color: primary }}
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
