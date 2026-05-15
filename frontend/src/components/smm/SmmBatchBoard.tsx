import { FolderOpen } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import {
  SMM_BOARD_COLUMNS,
  deriveSmmBatchColumn,
  smmBatchCardSubtitle,
  type SmmBoardColumn,
} from '@/lib/smmBoard'
import type { AdminVideoTicket } from '@mockData/index'
import { useTheme } from '@/theme'

type Props = {
  batches: AdminBatchFolder[]
  videos: AdminVideoTicket[]
  clientNameById: Map<string, string>
  onOpenBatch: (batchId: string) => void
}

export function SmmBatchBoard({
  batches,
  videos,
  clientNameById,
  onOpenBatch,
}: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  function batchesInColumn(col: SmmBoardColumn) {
    return batches.filter((b) => deriveSmmBatchColumn(b, videos) === col)
  }

  return (
    <div className="grid min-h-[380px] grid-cols-1 gap-3 pb-2 md:grid-cols-3">
      {SMM_BOARD_COLUMNS.map((col) => {
        const colBatches = batchesInColumn(col.id)
        return (
          <div
            key={col.id}
            className="bg-muted/20 border-border flex min-w-0 flex-col rounded-xl border"
          >
            <div className="border-border border-b px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground text-xs font-semibold">{col.label}</span>
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {colBatches.length}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">{col.hint}</p>
            </div>
            <ul className="flex min-h-[200px] flex-1 flex-col gap-2 p-2">
              {colBatches.length === 0 ? (
                <li className="text-muted-foreground px-2 py-6 text-center text-[11px]">—</li>
              ) : (
                colBatches.map((batch) => {
                  const clientName = clientNameById.get(batch.clientId) ?? 'Client'
                  const subtitle = smmBatchCardSubtitle(batch, videos)
                  return (
                    <li key={batch.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBatch(batch.id)
                        }}
                        className="border-border bg-background hover:border-primary/35 w-full rounded-lg border p-3 text-left shadow-sm transition-colors"
                        style={
                          col.id === 'in_progress'
                            ? { boxShadow: `0 0 0 1px ${primary}22 inset` }
                            : undefined
                        }
                      >
                        <div className="flex items-start gap-2">
                          <FolderOpen
                            className="mt-0.5 size-4 shrink-0 opacity-80"
                            style={{ color: col.id === 'in_progress' ? primary : undefined }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground text-xs font-semibold leading-snug">
                              {batch.title}
                            </p>
                            <p className="text-muted-foreground mt-1 text-[10px]">
                              {clientName} · Batch {batch.batchNumber}
                            </p>
                            <p className="text-muted-foreground mt-1.5 text-[10px] leading-snug">
                              {subtitle}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
