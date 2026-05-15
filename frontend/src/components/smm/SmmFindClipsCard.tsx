import { Scissors } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  onOpen: () => void
}

export function SmmFindClipsCard({ batch, clientName, onOpen }: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  return (
    <button
      type="button"
      onClick={onOpen}
      className="border-border bg-background hover:border-primary/35 group w-full rounded-lg border p-3 text-left shadow-sm transition-colors"
      style={{ borderColor: `${primary}40` }}
    >
      <div className="flex items-start gap-2">
        <Scissors
          className="mt-0.5 size-3.5 shrink-0"
          style={{ color: primary }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-xs font-semibold">Find clips</p>
          <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">
            {clientName} · Open raw footage, submit Drive folder
          </p>
          <span
            className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{
              background: `${primary}14`,
              color: primary,
            }}
          >
            Action needed
          </span>
        </div>
      </div>
      <p className="text-muted-foreground mt-2 truncate text-[10px]">
        {batch.title}
      </p>
    </button>
  )
}
