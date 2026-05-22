import { CalendarClock, Film, MessageSquareWarning, Scissors } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import {
  SMM_PATH_B_COLUMNS,
  batchNeedsSmmFindClips,
  batchReadyForScheduling,
  smmBatchKanbanPhase,
  smmCardActionable,
  videoNeedsSmmClientRevision,
  videoNeedsSmmQa,
  type SmmPathBVideoCard,
} from '@/lib/smmBoard'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  videos: SmmPathBVideoCard[]
  onFindClips: () => void
  onViewClips: () => void
  onScheduleBatch: () => void
  onOpenVideo: (videoId: string) => void
}

export function SmmPathBVideoKanban({
  batch,
  videos,
  onFindClips,
  onViewClips,
  onScheduleBatch,
  onOpenVideo,
}: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const phase = smmBatchKanbanPhase(batch)
  const showFindClips = batchNeedsSmmFindClips(batch)
  const showViewClips = phase === 'pre_split' && Boolean(batch.clipsFolderUrl?.trim())
  const showScheduleGate = batchReadyForScheduling(batch, videos)

  function cardsInColumn(colId: (typeof SMM_PATH_B_COLUMNS)[number]['id']) {
    return videos.filter((c) => c.pathBColumn === colId)
  }

  return (
    <div className="flex min-h-[420px] gap-3 overflow-x-auto pb-2">
      {SMM_PATH_B_COLUMNS.map((col) => {
        const columnCards = cardsInColumn(col.id)
        let count = columnCards.length
        if (col.id === 'identify' && showFindClips) count += 1
        if (col.id === 'identify' && showViewClips) count += 1
        if (col.id === 'schedule' && showScheduleGate) count += 1

        return (
          <div
            key={col.id}
            className="bg-muted/20 border-border flex w-[min(100%,260px)] shrink-0 flex-col rounded-xl border"
          >
            <div className="border-border border-b px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground text-xs font-semibold">{col.label}</span>
                <span className="text-muted-foreground text-[10px] tabular-nums">{count}</span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">{col.hint}</p>
            </div>
            <ul className="flex min-h-[200px] flex-1 flex-col gap-2 p-2">
              {col.id === 'identify' && showFindClips ? (
                <li>
                  <button
                    type="button"
                    onClick={onFindClips}
                    className="border-border bg-background hover:border-primary/35 group w-full rounded-lg border p-3 text-left shadow-sm transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <Scissors
                        className="size-3.5 shrink-0"
                        style={{ color: primary }}
                        aria-hidden
                      />
                      <div>
                        <p className="text-foreground text-xs font-medium leading-snug">
                          Submit clips folder
                        </p>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          Paste Drive link with numbered clips for client review
                        </p>
                        <span
                          className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                          style={{ background: `${primary}14`, color: primary }}
                        >
                          Open
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ) : null}
              {col.id === 'identify' && showViewClips ? (
                <li>
                  <button
                    type="button"
                    onClick={onViewClips}
                    className="border-border bg-background hover:border-primary/35 w-full rounded-lg border p-3 text-left shadow-sm transition-colors"
                  >
                    <p className="text-foreground text-xs font-medium leading-snug">
                      View clips folder
                    </p>
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      Sync manifest · {batch.clipReviewPhase === 'awaiting_client' ? 'client reviewing' : 'pre-split'}
                    </p>
                  </button>
                </li>
              ) : null}
              {col.id === 'schedule' && showScheduleGate ? (
                <li>
                  <button
                    type="button"
                    onClick={onScheduleBatch}
                    className="border-border bg-background hover:border-primary/35 w-full rounded-lg border p-3 text-left shadow-sm transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <CalendarClock
                        className="size-3.5 shrink-0"
                        style={{ color: primary }}
                        aria-hidden
                      />
                      <div>
                        <p className="text-foreground text-xs font-medium leading-snug">
                          Schedule batch
                        </p>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          Mark videos published · debit {batch.creditCost} credit
                          {batch.creditCost === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ) : null}
              {columnCards.length === 0 &&
              !(col.id === 'identify' && (showFindClips || showViewClips)) &&
              !(col.id === 'schedule' && showScheduleGate) ? (
                <li className="text-muted-foreground px-2 py-6 text-center text-[11px]">—</li>
              ) : null}
              {columnCards.map((card) => {
                const actionable = smmCardActionable(card, batch)
                const Icon = videoNeedsSmmClientRevision(card)
                  ? MessageSquareWarning
                  : videoNeedsSmmQa(card)
                    ? Film
                    : Film
                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      disabled={!actionable}
                      onClick={() => {
                        if (actionable) onOpenVideo(card.id)
                      }}
                      className={[
                        'border-border bg-background w-full rounded-lg border p-3 text-left shadow-sm',
                        actionable
                          ? 'hover:border-primary/35 cursor-pointer transition-colors'
                          : 'opacity-80',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-2">
                        <Icon
                          className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                          style={actionable ? { color: primary } : undefined}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground text-xs font-medium leading-snug">
                            #{card.deliverableIndex} · {card.title}
                          </p>
                          <p className="text-muted-foreground mt-1 text-[10px]">
                            {card.stageLabel}
                          </p>
                          {actionable ? (
                            <span
                              className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                              style={{ background: `${primary}14`, color: primary }}
                            >
                              Open
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
