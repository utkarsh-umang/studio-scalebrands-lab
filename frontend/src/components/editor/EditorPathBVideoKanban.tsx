import { Film, FolderOpen, Scissors, Wrench } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import {
  EDITOR_PATH_B_COLUMNS,
  batchNeedsEditorFindClips,
  editorBatchKanbanPhase,
  editorNeedsProductionWork,
  videoEditorQaReturn,
  videoNeedsEditorVideosSubmit,
  type EditorPathBVideoCard,
} from '@/lib/editorBoard'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  videos: EditorPathBVideoCard[]
  onFindClips: () => void
  onOpenGate: () => void
  onOpenVideo: (videoId: string) => void
}

export function EditorPathBVideoKanban({
  batch,
  videos,
  onFindClips,
  onOpenGate,
  onOpenVideo,
}: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const phase = editorBatchKanbanPhase(batch)
  const showFindClips = batchNeedsEditorFindClips(batch)
  const showSetupGate = phase === 'pre_split' && videoNeedsEditorVideosSubmit(batch)

  function cardsInColumn(colId: (typeof EDITOR_PATH_B_COLUMNS)[number]['id']) {
    return videos.filter((c) => c.pathBColumn === colId)
  }

  function cardActionable(card: EditorPathBVideoCard): boolean {
    return videoEditorQaReturn(card) || editorNeedsProductionWork(card)
  }

  return (
    <div className="flex min-h-[420px] gap-3 overflow-x-auto pb-2">
      {EDITOR_PATH_B_COLUMNS.map((col) => {
        const columnCards = cardsInColumn(col.id)
        let count = columnCards.length
        if (col.id === 'setup' && showFindClips) count += 1
        if (col.id === 'setup' && showSetupGate) count += 1

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
              {col.id === 'setup' && showFindClips ? (
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
                          Find clips
                        </p>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          Submit numbered clips folder for client review
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
              {col.id === 'setup' && showSetupGate ? (
                <li>
                  <button
                    type="button"
                    onClick={onOpenGate}
                    className="border-border bg-background hover:border-primary/35 group w-full rounded-lg border p-3 text-left shadow-sm transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <FolderOpen
                        className="size-3.5 shrink-0"
                        style={{ color: primary }}
                        aria-hidden
                      />
                      <div>
                        <p className="text-foreground text-xs font-medium leading-snug">
                          Submit deliverables folder
                        </p>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          Clips modal · paste Drive URL with videos/ + thumbnails/
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
              {columnCards.length === 0 &&
              !(col.id === 'setup' && (showFindClips || showSetupGate)) ? (
                <li className="text-muted-foreground px-2 py-6 text-center text-[11px]">—</li>
              ) : null}
              {columnCards.map((card) => {
                const actionable = cardActionable(card)
                const Icon = videoEditorQaReturn(card) ? Wrench : Film
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
                            {card.deliverableIndex != null
                              ? `#${card.deliverableIndex} · ${card.title}`
                              : card.title}
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
