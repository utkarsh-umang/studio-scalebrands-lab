import { useState } from 'react'
import { CalendarClock, Link2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_SMM_SCHEDULE_DETAILS } from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

export function SmmScheduleDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const { theme } = useTheme()
  const detail = batchId ? MOCK_SMM_SCHEDULE_DETAILS[batchId] : undefined

  const [platform, setPlatform] = useState(
    () => detail?.suggestedPlatform ?? '',
  )
  const [goLiveDate, setGoLiveDate] = useState('2026-05-06')
  const [goLiveTime, setGoLiveTime] = useState('17:00')
  const [publishLink, setPublishLink] = useState('')
  const [done, setDone] = useState(false)

  if (!detail) {
    return (
      <>
        <ClientPageHeader title="Batch not found" />
        <p className="text-muted-foreground text-sm">
          <Link
            to="/smm/scheduling"
            className="text-primary font-medium hover:underline"
          >
            ← Back to scheduling
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
          title={detail.title}
          subtitle={`${detail.clientName} · Final approved · Updated ${formatDate(detail.updatedAt)}`}
        />
        <Link
          to="/smm/scheduling"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All scheduled prep
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
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <CalendarClock className="text-foreground size-5 shrink-0" aria-hidden />
          <p className="text-foreground text-sm font-medium">
            Credits for this delivery:{' '}
            <span className="tabular-nums">{detail.creditCost}</span>
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="platform"
              className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value)
              }}
              className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            >
              <option value="">Select…</option>
              <option value="YouTube Shorts">YouTube Shorts</option>
              <option value="Instagram Reels">Instagram Reels</option>
              <option value="TikTok">TikTok</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="link"
              className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              <Link2 className="size-3" aria-hidden />
              Published link (optional)
            </label>
            <input
              id="link"
              type="url"
              value={publishLink}
              onChange={(e) => {
                setPublishLink(e.target.value)
              }}
              placeholder="https://…"
              className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="date"
              className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              Go-live date
            </label>
            <input
              id="date"
              type="date"
              value={goLiveDate}
              onChange={(e) => {
                setGoLiveDate(e.target.value)
              }}
              className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="time"
              className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              Time
            </label>
            <input
              id="time"
              type="time"
              value={goLiveTime}
              onChange={(e) => {
                setGoLiveTime(e.target.value)
              }}
              className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        <div className="border-border mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-xl text-xs">
            Confirming records the schedule and deducts{' '}
            <strong className="text-foreground/90">{detail.creditCost}</strong>{' '}
            credit(s) from the client balance (prototype — no API).
          </p>
          <button
            type="button"
            disabled={done || !platform}
            onClick={() => {
              setDone(true)
            }}
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-[filter] disabled:opacity-50"
            style={{ background: primary }}
          >
            {done ? 'Scheduled (prototype)' : 'Confirm schedule & deduct'}
          </button>
        </div>
      </div>
    </>
  )
}
