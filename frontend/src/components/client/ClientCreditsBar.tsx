import { Coins } from 'lucide-react'
import { useTheme } from '@/theme'

type Props = {
  credits: number
}

export function ClientCreditsBar({ credits }: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  return (
    <div
      className="border-border bg-background/90 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 backdrop-blur-xl"
      style={{
        borderColor: `${primary}35`,
        boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${primary}14`, border: `1px solid ${primary}30` }}
        >
          <Coins className="size-5" style={{ color: primary }} aria-hidden />
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
            Credits remaining
          </p>
          <p
            className="font-[family-name:var(--heading)] text-2xl font-bold tabular-nums"
            style={{ color: primary }}
          >
            {credits}
          </p>
        </div>
      </div>
      <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
        Each scheduled short deducts from your balance when the batch completes.
      </p>
    </div>
  )
}
