import { useState } from 'react'
import { Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_IDEA_BATCHES } from '@mockData/index'
import { ClientPageHeader, formatDate } from './clientPageUtils'

export function ClientIdeaDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const { theme } = useTheme()
  const batch = batchId ? MOCK_IDEA_BATCHES[batchId] : undefined

  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    if (!batch) return {}
    return Object.fromEntries(batch.ideas.map((i) => [i.id, false]))
  })
  const [submitted, setSubmitted] = useState(false)

  if (!batch) {
    return (
      <>
        <ClientPageHeader title="Batch not found" />
        <p className="text-muted-foreground text-sm">
          <Link to="/client/ideas" className="text-primary font-medium hover:underline">
            ← Back to batch ideas
          </Link>
        </p>
      </>
    )
  }

  const count = Object.values(selected).filter(Boolean).length

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ClientPageHeader
          title={batch.title}
          subtitle={`Updated ${formatDate(batch.updatedAt)} · Tap ideas to include in your approval.`}
        />
        <Link
          to="/client/ideas"
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
        <ul className="space-y-2">
          {batch.ideas.map((idea) => {
            const on = selected[idea.id]
            return (
              <li key={idea.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected((p) => ({ ...p, [idea.id]: !p[idea.id] }))
                  }}
                  className="border-border hover:bg-muted/30 flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors"
                  style={{
                    borderColor: on ? `${theme.colors.primary}55` : undefined,
                    background: on ? `${theme.colors.primary}0a` : undefined,
                  }}
                >
                  <div
                    className="flex size-5 shrink-0 items-center justify-center rounded border-2"
                    style={{
                      borderColor: on ? theme.colors.primary : 'var(--border)',
                      background: on ? theme.colors.primary : 'transparent',
                    }}
                  >
                    {on && <Check className="size-3 text-white" strokeWidth={3} aria-hidden />}
                  </div>
                  <span className="text-foreground text-sm leading-snug">{idea.title}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {!submitted ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                window.alert('Prototype: SMM would receive a re-request for new ideas.')
              }}
              className="border-border text-foreground hover:bg-muted/50 rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Request new ideas
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmitted(true)
              }}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{
                background: theme.colors.success,
                boxShadow: `0 8px 20px -6px ${theme.colors.success}88`,
              }}
            >
              Approve{count > 0 ? ` ${count} selected` : ''}
            </button>
          </div>
        ) : (
          <p
            className="mt-6 rounded-lg px-3 py-2 text-sm"
            style={{
              background: `${theme.colors.success}14`,
              color: theme.colors.success,
            }}
          >
            Ideas approved (prototype). You can proceed to filming per your workflow.
          </p>
        )}
      </div>
    </>
  )
}
