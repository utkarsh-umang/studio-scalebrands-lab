import { Film, Image, Pencil, User, Wrench } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import {
  EDITOR_BOARD_COLUMNS,
  editorStageHint,
  videoEditorQaReturn,
  videoNeedsEditorThumbnailsSubmit,
  videoNeedsEditorTitleSubmit,
  videoNeedsEditorVideosSubmit,
  type EditorBoardColumn,
  type EditorVideoCard,
} from '@/lib/editorBoard'
import { useTheme } from '@/theme'
import { EditorShareVideosCard } from './EditorShareVideosCard'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  videos: EditorVideoCard[]
  onOpenShareVideos: () => void
  onOpenVideo: (videoId: string) => void
}

export function EditorVideoKanban({
  batch,
  clientName,
  videos,
  onOpenShareVideos,
  onOpenVideo,
}: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const showShareVideos = videoNeedsEditorVideosSubmit(batch, videos)

  function cardsInColumn(col: EditorBoardColumn) {
    return videos.filter((c) => c.editorColumn === col)
  }

  function cardActionable(card: EditorVideoCard): boolean {
    return (
      videoEditorQaReturn(card) ||
      videoNeedsEditorThumbnailsSubmit(card) ||
      videoNeedsEditorTitleSubmit(card)
    )
  }

  return (
    <div className="flex min-h-[420px] gap-3 overflow-x-auto pb-2">
      {EDITOR_BOARD_COLUMNS.map((col) => {
        const columnCards = cardsInColumn(col.id)
        let count = columnCards.length
        if (col.id === 'videos_created' && showShareVideos) count += 1

        return (
          <div
            key={col.id}
            className="bg-muted/20 border-border flex w-[min(100%,280px)] shrink-0 flex-col rounded-xl border"
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
              {col.id === 'videos_created' && showShareVideos && (
                <li>
                  <EditorShareVideosCard
                    batch={batch}
                    clientName={clientName}
                    onOpen={onOpenShareVideos}
                  />
                </li>
              )}
              {columnCards.length === 0 &&
              !(col.id === 'videos_created' && showShareVideos) ? (
                <li className="text-muted-foreground px-2 py-6 text-center text-[11px]">
                  —
                </li>
              ) : null}
              {columnCards.map((card) => {
                const actionable = cardActionable(card)
                const Icon =
                  col.id === 'video_titles'
                    ? Pencil
                    : col.id === 'thumbnails_created'
                      ? Image
                      : Film
                const body = (
                  <>
                    <div className="flex items-start gap-2">
                      <Icon
                        className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                        style={actionable ? { color: primary } : undefined}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-xs font-medium leading-snug">
                          {card.title}
                        </p>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          {editorStageHint(card)}
                        </p>
                        {actionable && (
                          <span
                            className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                            style={{
                              background: `${primary}14`,
                              color: primary,
                            }}
                          >
                            Open
                          </span>
                        )}
                        {card.waitingOn && (
                          <span className="text-muted-foreground mt-1.5 inline-flex items-center gap-1 text-[10px]">
                            {card.waitingOn === 'client' ? (
                              <User className="size-3" aria-hidden />
                            ) : (
                              <Wrench className="size-3" aria-hidden />
                            )}
                            Waiting on {card.waitingOn}
                          </span>
                        )}
                        {card.editorPublishTitle && col.id === 'video_titles' && (
                          <p className="text-muted-foreground mt-1 truncate text-[10px]">
                            Title: {card.editorPublishTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )
                const cardClass = [
                  'border-border bg-background w-full rounded-lg border p-3 text-left shadow-sm',
                  actionable
                    ? 'hover:border-primary/35 cursor-pointer transition-colors'
                    : '',
                ].join(' ')

                return (
                  <li key={card.id}>
                    {actionable ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenVideo(card.id)
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
