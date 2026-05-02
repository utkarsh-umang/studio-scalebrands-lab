import { useState } from 'react'
import { ExternalLink, Plus, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_SMM_CLIP_BATCHES } from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

export function SmmClipBatchDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const { theme } = useTheme()
  const batch = batchId ? MOCK_SMM_CLIP_BATCHES[batchId] : undefined

  const [clips, setClips] = useState(() => batch?.clips ?? [])
  const [sent, setSent] = useState(false)

  if (!batch) {
    return (
      <>
        <ClientPageHeader title="Batch not found" />
        <p className="text-muted-foreground text-sm">
          <Link to="/smm/clips" className="text-primary font-medium hover:underline">
            ← Back to find clips
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
          subtitle={`${batch.clientName} · ${batch.footageLabel} · Updated ${formatDate(batch.updatedAt)}`}
        />
        <Link
          to="/smm/clips"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All clip batches
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
        <a
          href={batch.footageUrl}
          className="text-primary mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Open raw footage link
        </a>

        <p className="text-muted-foreground mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]">
          Proposed clips (edit titles, add rows)
        </p>
        <ul className="divide-border divide-y">
          {clips.map((clip, i) => (
            <li
              key={clip.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center"
            >
              <span className="text-muted-foreground w-6 shrink-0 text-xs tabular-nums">
                {i + 1}.
              </span>
              <input
                type="text"
                value={clip.title}
                onChange={(e) => {
                  const v = e.target.value
                  setClips((prev) =>
                    prev.map((c) =>
                      c.id === clip.id ? { ...c, title: v } : c,
                    ),
                  )
                }}
                className="border-border bg-background text-foreground focus:ring-primary/30 min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            setClips((prev) => [
              ...prev,
              {
                id: `new-${Date.now()}`,
                title: 'New clip angle',
              },
            ])
          }}
          className="text-primary hover:bg-primary/5 mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold"
        >
          <Plus className="size-3.5" aria-hidden />
          Add clip row
        </button>

        <div className="border-border mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-xl text-xs">
            When ready, send this list to the client. They approve or reject each
            clip (rejections require a reason).
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

        {sent && (
          <p
            className="mt-4 rounded-lg px-3 py-2 text-sm"
            style={{
              background: `${theme.colors.success}14`,
              color: theme.colors.success,
            }}
          >
            Clip list locked for review (mock). Client sees this under My batches.
          </p>
        )}
      </div>
    </>
  )
}
