import { useState } from 'react'
import { Check, ExternalLink, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_CLIP_BATCHES } from '@mockData/index'
import { ClientPageHeader, formatDate } from './clientPageUtils'

type ClipState = { approved: boolean | null; reason?: string }

export function ClientBatchDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const { theme } = useTheme()
  const batch = batchId ? MOCK_CLIP_BATCHES[batchId] : undefined

  const [clips, setClips] = useState<Record<string, ClipState>>(() => {
    if (!batch) return {}
    return Object.fromEntries(
      batch.clips.map((c) => [c.id, { approved: null as boolean | null }]),
    )
  })

  if (!batch) {
    return (
      <>
        <ClientPageHeader title="Batch not found" />
        <p className="text-muted-foreground text-sm">
          <Link to="/client/batches" className="text-primary font-medium hover:underline">
            ← Back to my batches
          </Link>
        </p>
      </>
    )
  }

  const allDecided = batch.clips.every((c) => clips[c.id]?.approved !== null)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ClientPageHeader
          title={batch.title}
          subtitle={`${batch.footageLabel} · Updated ${formatDate(batch.updatedAt)}`}
        />
        <Link
          to="/client/batches"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All batches
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
          View raw footage link
        </a>

        <p className="text-muted-foreground mb-4 text-[10px] font-semibold uppercase tracking-[0.12em]">
          Clip ideas — approve or reject each
        </p>
        <ul className="divide-border divide-y">
          {batch.clips.map((clip, i) => {
            const st = clips[clip.id] ?? { approved: null }
            return (
              <li
                key={clip.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold"
                    style={{
                      background:
                        st.approved === true
                          ? `${theme.colors.success}22`
                          : st.approved === false
                            ? `${theme.colors.destructive}18`
                            : 'var(--muted)',
                      color:
                        st.approved === true
                          ? theme.colors.success
                          : st.approved === false
                            ? theme.colors.destructive
                            : 'var(--muted-foreground)',
                    }}
                  >
                    {st.approved === true ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : st.approved === false ? (
                      <X className="size-3.5" aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="text-foreground text-sm leading-snug">
                    {clip.title}
                  </span>
                </div>
                {st.approved === null ? (
                  <div className="flex shrink-0 gap-2 sm:ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setClips((p) => ({
                          ...p,
                          [clip.id]: { approved: true },
                        }))
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-[filter]"
                      style={{
                        background: theme.colors.success,
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt('Reason for rejection (required):')
                        if (reason == null || !reason.trim()) return
                        setClips((p) => ({
                          ...p,
                          [clip.id]: { approved: false, reason: reason.trim() },
                        }))
                      }}
                      className="border-border text-destructive hover:bg-destructive/5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color:
                        st.approved === true
                          ? theme.colors.success
                          : theme.colors.destructive,
                    }}
                  >
                    {st.approved === true ? 'Approved' : 'Rejected'}
                  </span>
                )}
              </li>
            )
          })}
        </ul>

        {allDecided && (
          <p
            className="mt-5 rounded-lg px-3 py-2 text-sm"
            style={{
              background: `${theme.colors.success}14`,
              color: theme.colors.success,
            }}
          >
            All clips decided (prototype). SMM would proceed with approved clips.
          </p>
        )}
      </div>
    </>
  )
}
