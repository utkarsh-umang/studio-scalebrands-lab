import { ArrowUpRight, Folder, FolderOpen } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
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
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Active batches
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Choose a batch to see its progress and next step.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400">{batches.length} active</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
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
                'group flex w-[224px] shrink-0 flex-col rounded-2xl border p-4 text-left transition-all',
                selected
                  ? 'border-blue-200 bg-white shadow-[0_8px_24px_rgba(31,87,245,0.08)]'
                  : 'border-slate-200/80 bg-white/70 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white',
              ].join(' ')}
              style={
                selected
                  ? {
                      boxShadow: `0 0 0 1px ${primary}18 inset`,
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className={[
                      'flex size-8 shrink-0 items-center justify-center rounded-lg',
                      selected ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="text-foreground line-clamp-2 pt-1 text-sm font-semibold leading-snug">
                    {batch.title}
                  </span>
                </div>
                <ArrowUpRight
                  className={[
                    'mt-1 size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                    selected ? 'text-blue-600' : 'text-slate-300',
                  ].join(' ')}
                  aria-hidden
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Batch {batch.batchNumber}
                </span>
                {needsIntake ? (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                    Kickoff
                  </span>
                ) : null}
              </div>
              <span className="mt-2 line-clamp-1 text-[11px] text-slate-500">
                {needsIntake
                  ? 'Upload clipped raw videos'
                  : batch.intakePath === 'clips_ready'
                    ? `${batch.videoCount} ${batch.videoCount === 1 ? 'clip' : 'clips'} — with editor`
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
