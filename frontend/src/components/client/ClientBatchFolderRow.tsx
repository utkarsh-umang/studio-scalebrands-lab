import { Folder, FolderOpen } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { batchNeedsClientIntake } from '@/lib/clientBoard'
import { formatDate } from '@/pages/client/clientPageUtils'
import { useTheme } from '@/theme'

type Props = {
  batches: AdminBatchFolder[]
  selectedBatchId: string | null
  onSelect: (batchId: string) => void
}

export function ClientBatchFolderRow({
  batches,
  selectedBatchId,
  onSelect,
}: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  if (batches.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No batch folders yet — your admin will create one when you&apos;re ready
        to start.
      </p>
    )
  }

  return (
    <section className="space-y-2">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
        Batch folders
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {batches.map((batch) => {
          const selected = batch.id === selectedBatchId
          const needsIntake = batchNeedsClientIntake(batch)
          const Icon = selected ? FolderOpen : Folder
          return (
            <button
              key={batch.id}
              type="button"
              onClick={() => {
                onSelect(batch.id)
              }}
              className={[
                'flex w-[200px] shrink-0 flex-col rounded-xl border p-3 text-left transition-all',
                selected
                  ? 'border-primary/50 bg-background shadow-sm'
                  : 'border-border bg-background/80 hover:border-primary/25',
              ].join(' ')}
              style={
                selected
                  ? {
                      boxShadow: `0 0 0 1px ${primary}30 inset`,
                    }
                  : undefined
              }
            >
              <div className="flex items-start gap-2">
                <Icon
                  className="size-4 shrink-0"
                  style={{ color: selected ? primary : undefined }}
                  aria-hidden
                />
                <span className="text-foreground line-clamp-2 text-sm font-medium leading-snug">
                  {batch.title}
                </span>
              </div>
              <span className="text-muted-foreground mt-2 text-[10px]">
                Batch {batch.batchNumber}
                {batch.status === 'completed' ? ' · Done' : ''}
              </span>
              <span className="text-muted-foreground mt-0.5 text-[10px]">
                {needsIntake
                  ? 'Submit source or clips link'
                  : batch.intakePath === 'clips_ready'
                    ? 'Clips folder — with editor'
                    : batch.clipReviewPhase === 'awaiting_client'
                      ? 'Clip approval needed'
                      : `Updated ${formatDate(batch.updatedAt)}`}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
