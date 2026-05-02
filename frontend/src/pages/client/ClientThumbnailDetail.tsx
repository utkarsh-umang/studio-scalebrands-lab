import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_TEXT_BATCHES } from '@mockData/index'
import { ClientPageHeader, formatDate } from './clientPageUtils'

export function ClientThumbnailDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const { theme } = useTheme()
  const batch = batchId ? MOCK_TEXT_BATCHES[batchId] : undefined
  const [approved, setApproved] = useState(false)

  if (!batch) {
    return (
      <>
        <ClientPageHeader title="Batch not found" />
        <p className="text-muted-foreground text-sm">
          <Link
            to="/client/thumbnails"
            className="text-primary font-medium hover:underline"
          >
            ← Back to thumbnails & titles
          </Link>
        </p>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ClientPageHeader
          title={batch.title}
          subtitle={`Submitted by SMM · ${formatDate(batch.updatedAt)}`}
        />
        <Link
          to="/client/thumbnails"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All copy reviews
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-muted/50 border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
              Thumbnail text
            </p>
            <p className="font-[family-name:var(--heading)] text-foreground text-lg font-bold leading-snug">
              {batch.thumbnailText}
            </p>
          </div>
          <div className="bg-muted/50 border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
              Video title
            </p>
            <p className="text-foreground text-sm leading-snug">{batch.videoTitle}</p>
          </div>
        </div>

        {!approved ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                const reason = window.prompt('What should change? (sent to SMM in a real build)')
                if (reason == null) return
              }}
              className="border-border text-destructive hover:bg-destructive/5 rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => {
                setApproved(true)
              }}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{
                background: theme.colors.success,
                boxShadow: `0 8px 20px -6px ${theme.colors.success}88`,
              }}
            >
              Approve for editing
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
            Approved (prototype). Editor can start thumbnail and cut.
          </p>
        )}
      </div>
    </>
  )
}
