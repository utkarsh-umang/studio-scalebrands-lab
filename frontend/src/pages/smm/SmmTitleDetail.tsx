import { useState } from 'react'
import { Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_SMM_TEXT_BATCHES } from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

export function SmmTitleDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const { theme } = useTheme()
  const batch = batchId ? MOCK_SMM_TEXT_BATCHES[batchId] : undefined

  const [thumb, setThumb] = useState(batch?.thumbnailText ?? '')
  const [videoTitle, setVideoTitle] = useState(batch?.videoTitle ?? '')
  const [sent, setSent] = useState(false)

  if (!batch) {
    return (
      <>
        <ClientPageHeader title="Batch not found" />
        <p className="text-muted-foreground text-sm">
          <Link
            to="/smm/titles"
            className="text-primary font-medium hover:underline"
          >
            ← Back to titles & copy
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
          to="/smm/titles"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All text batches
        </Link>
      </div>

      <div
        className="border-border bg-background/85 grid gap-6 rounded-2xl border p-5 backdrop-blur-xl md:grid-cols-2"
        style={{
          boxShadow: `
            0 20px 60px -18px rgba(5, 9, 14, 0.14),
            0 0 0 1px rgba(255, 255, 255, 0.55) inset
          `,
        }}
      >
        <div className="space-y-2">
          <label
            htmlFor="thumb"
            className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            Thumbnail text
          </label>
          <textarea
            id="thumb"
            value={thumb}
            onChange={(e) => {
              setThumb(e.target.value)
            }}
            rows={3}
            className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="vtitle"
            className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            Video title
          </label>
          <textarea
            id="vtitle"
            value={videoTitle}
            onChange={(e) => {
              setVideoTitle(e.target.value)
            }}
            rows={3}
            className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
          {sent ? 'Sent (prototype)' : 'Submit to client for review'}
        </button>
      </div>
    </>
  )
}
