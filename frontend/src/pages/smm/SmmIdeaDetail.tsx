import { useState } from 'react'
import { Plus, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_SMM_IDEA_BATCHES } from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

export function SmmIdeaDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const { theme } = useTheme()
  const batch = batchId ? MOCK_SMM_IDEA_BATCHES[batchId] : undefined

  const [ideas, setIdeas] = useState(() => batch?.ideas ?? [])
  const [sent, setSent] = useState(false)

  if (!batch) {
    return (
      <>
        <ClientPageHeader title="Batch not found" />
        <p className="text-muted-foreground text-sm">
          <Link to="/smm/ideas" className="text-primary font-medium hover:underline">
            ← Back to batch ideas
          </Link>
        </p>
      </>
    )
  }

  const primary = theme.colors.primary

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ClientPageHeader
          title={batch.title}
          subtitle={`${batch.clientName} · Updated ${formatDate(batch.updatedAt)}`}
        />
        <Link
          to="/smm/ideas"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All idea batches
        </Link>
      </div>

      <div
        className="border-border bg-background/85 rounded-2xl border p-5 backdrop-blur-xl"
        style={{
          boxShadow: `
            0 20px 60px -18px rgba(5, 9, 14, 0.14),
            0 0 0 1px rgba(255, 255, 255, 0.55) inset
          `,
        }}
      >
        <p className="text-muted-foreground mb-4 text-[10px] font-semibold uppercase tracking-[0.12em]">
          Video ideas — client will approve or request more
        </p>
        <ul className="divide-border divide-y">
          {ideas.map((idea, i) => (
            <li key={idea.id} className="flex gap-2 py-3">
              <span className="text-muted-foreground mt-2 w-6 shrink-0 text-xs">
                {i + 1}.
              </span>
              <textarea
                value={idea.title}
                onChange={(e) => {
                  const v = e.target.value
                  setIdeas((prev) =>
                    prev.map((x) =>
                      x.id === idea.id ? { ...x, title: v } : x,
                    ),
                  )
                }}
                rows={2}
                className="border-border bg-background text-foreground focus:ring-primary/30 min-h-[2.75rem] w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            setIdeas((prev) => [
              ...prev,
              { id: `i-${Date.now()}`, title: 'New hook idea' },
            ])
          }}
          className="text-primary hover:bg-primary/5 mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold"
        >
          <Plus className="size-3.5" aria-hidden />
          Add idea
        </button>

        <div className="border-border mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-xl text-xs">
            Internal research can be prompt-assisted; this list is what the client
            sees for approval.
          </p>
          <button
            type="button"
            disabled={sent}
            onClick={() => {
              setSent(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-[filter] disabled:opacity-60"
            style={{ background: primary }}
          >
            <Send className="size-4" aria-hidden />
            {sent ? 'Sent (prototype)' : 'Submit to client'}
          </button>
        </div>
      </div>
    </>
  )
}
