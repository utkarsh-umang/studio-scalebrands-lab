import { CalendarClock } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  videoCount: number
  onOpen: () => void
}

export function SmmScheduleBatchCard({ batch, videoCount, onOpen }: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  return (
    <button
      type="button"
      onClick={onOpen}
      className="border-border bg-background hover:border-primary/35 group w-full rounded-lg border p-3 text-left shadow-sm transition-colors"
      style={{ borderColor: `${primary}35` }}
    >
      <div className="flex items-start gap-2">
        <CalendarClock
          className="mt-0.5 size-3.5 shrink-0"
          style={{ color: primary }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-xs font-semibold">
            Mark batch complete
          </p>
          <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">
            {videoCount} video{videoCount === 1 ? '' : 's'} to confirm scheduled
            · {batch.creditCost} credit{batch.creditCost === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </button>
  )
}
