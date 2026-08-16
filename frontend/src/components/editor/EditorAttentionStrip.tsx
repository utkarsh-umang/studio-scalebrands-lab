import { FolderOpen, Film, Scissors, Wrench } from 'lucide-react'
import type { EditorAttentionItem } from '@/lib/editorBoard'
import { useTheme } from '@/theme'

const kindLabel: Record<EditorAttentionItem['kind'], string> = {
  find_clips: 'Find clips',
  submit_deliverables: 'Upload production files',
  pre_split_gate: 'Open clips & upload files',
  qa_fix: 'Fix QA feedback',
  production: 'Finish production',
}

type Props = {
  items: EditorAttentionItem[]
  onOpen: (item: EditorAttentionItem) => void
}

export function EditorAttentionStrip({ items, onOpen }: Props) {
  const { theme } = useTheme()

  if (items.length === 0) return null

  return (
    <section
      className="border-border bg-background/90 rounded-xl border p-3 backdrop-blur-sm"
      style={{ boxShadow: `0 0 0 1px ${theme.colors.primary}12 inset` }}
    >
      <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
        Needs you
      </p>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {items.map((item) => (
          <li key={`${item.batchId}-${item.kind}-${item.videoId ?? ''}`}>
            <button
              type="button"
              onClick={() => {
                onOpen(item)
              }}
              className="border-border hover:border-primary/35 bg-muted/30 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors sm:w-auto"
            >
              {item.kind === 'find_clips' ? (
                <Scissors
                  className="size-3.5 shrink-0"
                  style={{ color: theme.colors.primary }}
                  aria-hidden
                />
              ) : item.kind === 'qa_fix' ? (
                <Wrench
                  className="size-3.5 shrink-0"
                  style={{ color: theme.colors.primary }}
                  aria-hidden
                />
              ) : item.kind === 'production' ? (
                <Film
                  className="size-3.5 shrink-0"
                  style={{ color: theme.colors.primary }}
                  aria-hidden
                />
              ) : (
                <FolderOpen
                  className="size-3.5 shrink-0"
                  style={{ color: theme.colors.primary }}
                  aria-hidden
                />
              )}
              <span className="min-w-0">
                <span className="text-foreground block font-semibold">
                  {kindLabel[item.kind]}
                  {item.count != null && item.count > 1 ? ` (${item.count})` : ''}
                </span>
                <span className="text-muted-foreground block truncate text-[10px]">
                  {item.clientName} · {item.batchTitle}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
