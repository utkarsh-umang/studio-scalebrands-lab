import { Film, ScanEye, User, Wrench } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import {
  SMM_BOARD_COLUMNS,
  batchNeedsSmmFindClips,
  batchReadyForScheduling,
  smmStageHint,
  videoNeedsSmmQa,
  type SmmBoardColumn,
  type SmmVideoCard,
} from '@/lib/smmBoard'
import { useTheme } from '@/theme'
import { SmmFindClipsCard } from './SmmFindClipsCard'
import { SmmScheduleBatchCard } from './SmmScheduleBatchCard'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  videos: SmmVideoCard[]
  onOpenFindClips: () => void
  onOpenSchedule: () => void
  onOpenVideoQa: (videoId: string) => void
}

export function SmmVideoKanban({
  batch,
  clientName,
  videos,
  onOpenFindClips,
  onOpenSchedule,
  onOpenVideoQa,
}: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const showFindClips = batchNeedsSmmFindClips(batch)
  const showSchedule = batchReadyForScheduling(batch, videos)

  function cardsInColumn(col: SmmBoardColumn) {
    return videos.filter((c) => c.smmColumn === col)
  }

  return (
    <div className="flex min-h-[420px] gap-3 overflow-x-auto pb-2">
      {SMM_BOARD_COLUMNS.map((col) => {
        const columnCards = cardsInColumn(col.id)
        let count = columnCards.length
        if (col.id === 'yet_to_start' && showFindClips) count += 1
        if (col.id === 'in_progress' && showSchedule) count += 1

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
              {col.id === 'yet_to_start' && showFindClips && (
                <li>
                  <SmmFindClipsCard
                    batch={batch}
                    clientName={clientName}
                    onOpen={onOpenFindClips}
                  />
                </li>
              )}
              {col.id === 'in_progress' && showSchedule && (
                <li>
                  <SmmScheduleBatchCard
                    batch={batch}
                    videoCount={
                      videos.filter((v) => v.owner === 'scheduling').length
                    }
                    onOpen={onOpenSchedule}
                  />
                </li>
              )}
              {columnCards.length === 0 &&
              !(col.id === 'yet_to_start' && showFindClips) &&
              !(col.id === 'in_progress' && showSchedule) ? (
                <li className="text-muted-foreground px-2 py-6 text-center text-[11px]">
                  —
                </li>
              ) : null}
              {columnCards.map((card) => {
                const qaOpen = videoNeedsSmmQa(card)
                const cardClass = [
                  'border-border bg-background w-full rounded-lg border p-3 text-left shadow-sm',
                  qaOpen ? 'hover:border-primary/35 cursor-pointer transition-colors' : '',
                ].join(' ')
                const body = (
                  <>
                    <div className="flex items-start gap-2">
                      {qaOpen ? (
                        <ScanEye
                          className="mt-0.5 size-3.5 shrink-0"
                          style={{ color: primary }}
                          aria-hidden
                        />
                      ) : (
                        <Film
                          className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-xs font-medium leading-snug">
                          {card.title}
                        </p>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          {smmStageHint(card.stageLabel)}
                        </p>
                        {qaOpen && (
                          <span
                            className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                            style={{
                              background: `${primary}14`,
                              color: primary,
                            }}
                          >
                            Open QA
                          </span>
                        )}
                        {card.smmColumn === 'waiting' && card.waitingOn && (
                          <span className="text-muted-foreground mt-1.5 inline-flex items-center gap-1 text-[10px]">
                            {card.waitingOn === 'client' ? (
                              <User className="size-3" aria-hidden />
                            ) : (
                              <Wrench className="size-3" aria-hidden />
                            )}
                            Waiting on {card.waitingOn}
                          </span>
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
                  </>
                )
                return (
                  <li key={card.id}>
                    {qaOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenVideoQa(card.id)
                        }}
                        className={cardClass}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className={cardClass}>{body}</div>
                    )}
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
