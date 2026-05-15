import { Film, Upload } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import {
  CLIENT_BOARD_COLUMNS,
  batchNeedsClientIntake,
  type ClientBoardColumn,
  type ClientVideoCard,
} from '@/lib/clientBoard'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  videos: ClientVideoCard[]
  onOpenVideo: (videoId: string) => void
}

export function ClientVideoKanban({ batch, videos, onOpenVideo }: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const cards = videos
  const intakeDone = !batchNeedsClientIntake(batch)

  function cardsInColumn(col: ClientBoardColumn) {
    return cards.filter((c) => c.clientColumn === col)
  }

  return (
    <div className="flex min-h-[420px] gap-3 overflow-x-auto pb-2">
      {CLIENT_BOARD_COLUMNS.map((col) => {
        const columnCards = cardsInColumn(col.id)
        const count = columnCards.length

        return (
          <div
            key={col.id}
            className="bg-muted/20 border-border flex w-[min(100%,260px)] shrink-0 flex-col rounded-xl border"
          >
            <div className="border-border border-b px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground text-xs font-semibold">
                  {col.label}
                </span>
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {count}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">
                {col.hint}
              </p>
            </div>
            <ul className="flex min-h-[200px] flex-1 flex-col gap-2 p-2">
              {col.id === 'yet_to_start' && !intakeDone ? (
                <li className="text-muted-foreground flex flex-col items-center gap-1 px-2 py-6 text-center text-[11px]">
                  <Upload className="size-4 opacity-50" aria-hidden />
                  Submit your podcast or clips link above to kick off this batch.
                </li>
              ) : null}
              {columnCards.length === 0 && intakeDone && col.id === 'yet_to_start' ? (
                <li className="text-muted-foreground flex flex-col items-center gap-1 px-2 py-6 text-center text-[11px]">
                  <Upload className="size-4 opacity-50" aria-hidden />
                  Kickoff items appear here
                </li>
              ) : null}
              {columnCards.length === 0 && col.id !== 'yet_to_start' ? (
                <li className="text-muted-foreground px-2 py-6 text-center text-[11px]">
                  —
                </li>
              ) : null}
              {columnCards.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenVideo(card.id)
                    }}
                    className="border-border bg-background hover:border-primary/35 group w-full rounded-lg border p-3 text-left shadow-sm transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <Film
                        className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-xs font-medium leading-snug">
                          {card.title}
                        </p>
                        {card.clientColumn === 'in_review' && card.reviewKind && (
                          <span
                            className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                            style={{
                              background: `${theme.colors.destructive}14`,
                              color: theme.colors.destructive,
                            }}
                          >
                            Action needed
                          </span>
                        )}
                        {card.clientColumn !== 'in_review' && (
                          <p className="text-muted-foreground mt-1 text-[10px]">
                            With Scale Brands
                          </p>
                        )}
                      </div>
                    </div>
                    {col.id === 'completed' && (
                      <p
                        className="mt-2 text-[10px] font-medium"
                        style={{ color: primary }}
                      >
                        Scheduled
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
