import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import { useIdeasMutations } from '@/hooks/api/pathB/useIdeasMutations'

type Props = { batch: AdminBatchFolder }

/** Path A client surface: idea research status, idea review, and footage handoff. */
export function ClientIdeaPanel({ batch }: Props) {
  const { approveIdeas, rejectIdeas, submitFootage } = useIdeasMutations(batch.id)
  const [rejectNote, setRejectNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [footageUrl, setFootageUrl] = useState('')

  const stage = batch.pipelineStage
  const ideas = batch.ideaList ?? []

  if (stage === 'idea_research') {
    return (
      <div className="border-border bg-muted/10 rounded-xl border px-4 py-8 text-center">
        <Lightbulb className="text-muted-foreground mx-auto size-6" aria-hidden />
        <p className="text-foreground mt-2 text-sm font-medium">Researching video ideas</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Your Social Media Manager is putting together a list of ideas. You'll be able to review
          them here shortly.
        </p>
      </div>
    )
  }

  if (stage === 'idea_review') {
    return (
      <div className="border-border bg-background space-y-4 rounded-xl border p-4">
        <div>
          <p className="text-foreground text-sm font-semibold">Review your video ideas</p>
          <p className="text-muted-foreground text-xs">
            Approve to move ahead, or ask for a different set.
          </p>
        </div>
        <ol className="space-y-2">
          {ideas.map((idea, i) => (
            <li key={i} className="border-border bg-muted/20 flex gap-2 rounded-lg border px-3 py-2 text-sm">
              <span className="text-muted-foreground font-semibold tabular-nums">{i + 1}.</span>
              <span className="text-foreground">{idea}</span>
            </li>
          ))}
        </ol>
        {rejecting ? (
          <div className="space-y-2">
            <textarea
              value={rejectNote}
              onChange={(e) => {
                setRejectNote(e.target.value)
              }}
              placeholder="What would you like to see instead? (optional)"
              rows={3}
              className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={rejectIdeas.isPending}
                onClick={() => {
                  rejectIdeas.mutate(rejectNote.trim() || null)
                }}
                className="bg-destructive/10 text-destructive border-destructive/30 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                Send back for new ideas
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejecting(false)
                }}
                className="border-border text-muted-foreground rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={approveIdeas.isPending}
              onClick={() => {
                approveIdeas.mutate()
              }}
              className="bg-primary text-[var(--primary-foreground)] rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              Approve ideas
            </button>
            <button
              type="button"
              onClick={() => {
                setRejecting(true)
              }}
              className="border-border text-foreground rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Request different ideas
            </button>
          </div>
        )}
      </div>
    )
  }

  if (stage === 'idea_footage_pending') {
    return (
      <div className="border-border bg-background space-y-3 rounded-xl border p-4">
        <div>
          <p className="text-foreground text-sm font-semibold">Send your footage</p>
          <p className="text-muted-foreground text-xs">
            Ideas approved. Record your videos, then paste the shared Drive/source link — we'll take
            it into production (no clip review needed).
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={footageUrl}
            onChange={(e) => {
              setFootageUrl(e.target.value)
            }}
            placeholder="https://drive.google.com/…"
            className="border-border bg-background text-foreground min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          <button
            type="button"
            disabled={!footageUrl.trim() || submitFootage.isPending}
            onClick={() => {
              submitFootage.mutate(footageUrl.trim())
            }}
            className="bg-primary text-[var(--primary-foreground)] shrink-0 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Send footage
          </button>
        </div>
      </div>
    )
  }

  return null
}
