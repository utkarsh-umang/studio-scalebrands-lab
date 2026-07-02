import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import { useIdeasMutations } from '@/hooks/api/pathB/useIdeasMutations'

type Props = { batch: AdminBatchFolder }

/** Path A SMM surface: research + submit a list of video ideas for client review. */
export function SmmIdeaResearchPanel({ batch }: Props) {
  const { submitIdeas } = useIdeasMutations(batch.id)
  const [draft, setDraft] = useState((batch.ideaList ?? []).join('\n'))

  const ideas = draft
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="border-border bg-background space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="text-primary size-4" aria-hidden />
        <p className="text-foreground text-sm font-semibold">Research video ideas</p>
      </div>
      <p className="text-muted-foreground text-xs">
        One idea per line. The client approves the list before recording.
      </p>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
        }}
        rows={6}
        placeholder={'5 editing mistakes beginners make\nBest budget mic under $100\nAI tools tier list'}
        className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">{ideas.length} idea(s)</span>
        <button
          type="button"
          disabled={ideas.length === 0 || submitIdeas.isPending}
          onClick={() => {
            submitIdeas.mutate(ideas)
          }}
          className="bg-primary text-[var(--primary-foreground)] rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Submit for client approval
        </button>
      </div>
    </div>
  )
}
