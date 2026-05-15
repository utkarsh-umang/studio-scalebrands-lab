import { Coins } from 'lucide-react'
import { useTheme } from '@/theme'

type Props = {
  credits: number
}

/** Compact credits pill for the page title row. */
export function ClientCreditsBadge({ credits }: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  return (
    <div
      className="border-border bg-background/95 flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-xl"
      style={{
        borderColor: `${primary}30`,
        boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
      }}
    >
      <Coins className="size-3.5 shrink-0" style={{ color: primary }} aria-hidden />
      <div className="text-left">
        <p className="text-muted-foreground text-[9px] font-semibold uppercase tracking-[0.1em]">
          Credits
        </p>
        <p
          className="font-[family-name:var(--heading)] text-lg font-bold leading-none tabular-nums"
          style={{ color: primary }}
        >
          {credits}
        </p>
      </div>
    </div>
  )
}
