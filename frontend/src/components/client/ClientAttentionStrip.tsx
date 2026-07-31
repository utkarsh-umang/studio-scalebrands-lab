import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
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
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <CheckCircle2 className="size-4.5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">You&apos;re all caught up</p>
          <p className="mt-0.5 text-xs text-slate-500">
            We&apos;ll bring approvals and questions here when they need you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-3xl border border-rose-100 bg-rose-50/60 p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle
          className="size-5"
          style={{ color: theme.colors.destructive }}
          aria-hidden
        />
        <h2 className="text-sm font-semibold text-slate-950">
          {items.length} item{items.length === 1 ? '' : 's'} waiting for you
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
              className="flex w-full items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
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
