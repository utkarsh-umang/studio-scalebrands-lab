import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { StudioModalShell } from '@/components/StudioModalShell'
import { deliverableIndexForTicket } from '@/lib/driveMedia'
import { useScheduleVideoMutation } from '@/hooks/api/pathB/useScheduleVideoMutation'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  ticket: AdminVideoTicket
  open: boolean
  onClose: () => void
}

export function SmmScheduleVideoModal({
  batch,
  clientName,
  ticket,
  open,
  onClose,
}: Props) {
  const { theme } = useTheme()
  const scheduleVideo = useScheduleVideoMutation()
  const index = deliverableIndexForTicket(ticket)

  const [platform, setPlatform] = useState('YouTube Shorts')
  const [goLiveDate, setGoLiveDate] = useState('2026-05-20')
  const [goLiveTime, setGoLiveTime] = useState('17:00')

  useEffect(() => {
    if (!open) return
    setPlatform(ticket.videoSchedule?.platform ?? 'YouTube Shorts')
    const existing = ticket.videoSchedule?.goLiveAt
    if (existing) {
      const d = new Date(existing)
      setGoLiveDate(d.toISOString().slice(0, 10))
      setGoLiveTime(d.toISOString().slice(11, 16))
    } else {
      setGoLiveDate('2026-05-20')
      setGoLiveTime('17:00')
    }
  }, [open, ticket.id, ticket.videoSchedule])

  if (!open) return null

  const primary = theme.colors.primary
  const canSave = platform.trim() && goLiveDate && goLiveTime

  function handleSave() {
    if (!canSave) return
    scheduleVideo.mutate(
      {
        videoTicketId: ticket.id,
        body: { platform: platform.trim(), goLiveDate, goLiveTime },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <StudioModalShell
      title="Set go-live"
      subtitle={`${clientName} · #${index} · ${ticket.title}`}
      titleId="smm-schedule-video-title"
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted/50 rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: primary }}
          >
            <CalendarClock className="size-3.5" aria-hidden />
            Mark scheduled
          </button>
        </div>
      }
    >
      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
        Schedule this video on your platform when you are ready. Other videos in the batch can be
        scheduled separately. Client credits (
        <strong className="text-foreground">{batch.creditCost}</strong>) debit only after{' '}
        <strong className="text-foreground">every</strong> video in this batch is scheduled.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="schedule-video-platform"
            className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            Platform
          </label>
          <select
            id="schedule-video-platform"
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value)
            }}
            className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="YouTube Shorts">YouTube Shorts</option>
            <option value="Instagram Reels">Instagram Reels</option>
            <option value="TikTok">TikTok</option>
            <option value="Facebook">Facebook</option>
            <option value="LinkedIn">LinkedIn</option>
          </select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="schedule-video-date"
            className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            Go-live date
          </label>
          <input
            id="schedule-video-date"
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
            htmlFor="schedule-video-time"
            className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            Time
          </label>
          <input
            id="schedule-video-time"
            type="time"
            value={goLiveTime}
            onChange={(e) => {
              setGoLiveTime(e.target.value)
            }}
            className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          />
        </div>
      </div>
    </StudioModalShell>
  )
}
