import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, Link2, X } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  videos: AdminVideoTicket[]
  open: boolean
  onClose: () => void
}

type VideoScheduleRow = {
  videoId: string
  title: string
  scheduled: boolean
  publishLink: string
}

export function SmmScheduleBatchModal({
  batch,
  clientName,
  videos,
  open,
  onClose,
}: Props) {
  const { theme } = useTheme()
  const { scheduleBatch } = useAdminWorkspace()

  const schedulingVideos = useMemo(
    () => videos.filter((v) => v.owner === 'scheduling'),
    [videos],
  )

  const [platform, setPlatform] = useState('YouTube Shorts')
  const [goLiveDate, setGoLiveDate] = useState('2026-05-15')
  const [goLiveTime, setGoLiveTime] = useState('17:00')
  const [rows, setRows] = useState<VideoScheduleRow[]>(() =>
    schedulingVideos.map((v) => ({
      videoId: v.id,
      title: v.title,
      scheduled: false,
      publishLink: '',
    })),
  )
  const [attestation, setAttestation] = useState(false)

  useEffect(() => {
    if (!open) return
    setRows(
      schedulingVideos.map((v) => ({
        videoId: v.id,
        title: v.title,
        scheduled: false,
        publishLink: '',
      })),
    )
    setAttestation(false)
  }, [open, batch.id, schedulingVideos])

  const primary = theme.colors.primary
  const success = theme.colors.success

  const allVideosMarked = rows.length > 0 && rows.every((r) => r.scheduled)
  const canComplete = allVideosMarked && attestation && platform.trim()

  if (!open) return null

  function toggleScheduled(videoId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.videoId === videoId ? { ...r, scheduled: !r.scheduled } : r,
      ),
    )
  }

  function setPublishLink(videoId: string, publishLink: string) {
    setRows((prev) =>
      prev.map((r) => (r.videoId === videoId ? { ...r, publishLink } : r)),
    )
  }

  function handleComplete() {
    if (!canComplete) return
    scheduleBatch(batch.id, {
      platform,
      goLiveDate,
      goLiveTime,
      allVideosScheduled: true,
      videos: rows.map((r) => ({
        videoId: r.videoId,
        publishLink: r.publishLink.trim() || undefined,
      })),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-batch-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="border-border bg-background relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p
              id="schedule-batch-title"
              className="text-foreground font-[family-name:var(--heading)] text-lg font-bold"
            >
              Mark batch complete
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {clientName} · {batch.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1"
            aria-label="Close dialog"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          Confirm each video is scheduled on your platform, then complete the
          batch. This deducts{' '}
          <strong className="text-foreground/90">{batch.creditCost}</strong>{' '}
          credit{batch.creditCost === 1 ? '' : 's'} from the client and archives
          the folder.
        </p>

        {schedulingVideos.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No videos are waiting to be scheduled in this batch yet.
          </p>
        ) : (
          <>
            <ul className="border-border mb-4 space-y-3 rounded-lg border p-2">
              {rows.map((row) => (
                <li
                  key={row.videoId}
                  className="border-border rounded-lg border p-2.5"
                >
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={row.scheduled}
                      onChange={() => {
                        toggleScheduled(row.videoId)
                      }}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block text-xs font-semibold">
                        {row.title}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        I have scheduled this video
                      </span>
                    </span>
                    {row.scheduled && (
                      <Check
                        className="size-3.5 shrink-0"
                        style={{ color: success }}
                        aria-hidden
                      />
                    )}
                  </label>
                  <label className="mt-2 block space-y-1 pl-6">
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide">
                      <Link2 className="size-3" aria-hidden />
                      Published link (optional)
                    </span>
                    <input
                      type="url"
                      value={row.publishLink}
                      onChange={(e) => {
                        setPublishLink(row.videoId, e.target.value)
                      }}
                      placeholder="https://…"
                      className="border-border bg-background text-foreground w-full rounded-md border px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    />
                  </label>
                </li>
              ))}
            </ul>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="schedule-platform"
                  className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
                >
                  Primary platform
                </label>
                <select
                  id="schedule-platform"
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
                </select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="schedule-date"
                  className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
                >
                  Go-live date
                </label>
                <input
                  id="schedule-date"
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
                  htmlFor="schedule-time"
                  className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]"
                >
                  Time
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={goLiveTime}
                  onChange={(e) => {
                    setGoLiveTime(e.target.value)
                  }}
                  className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                />
              </div>
            </div>

            <label className="border-border hover:border-primary/30 mt-4 flex cursor-pointer items-start gap-2 rounded-lg border p-3">
              <input
                type="checkbox"
                checked={attestation}
                onChange={(e) => {
                  setAttestation(e.target.checked)
                }}
                className="mt-0.5"
              />
              <span className="text-xs leading-snug">
                <span className="text-foreground font-semibold">
                  All videos in this batch are scheduled
                </span>
                <span className="text-muted-foreground block">
                  I confirm every deliverable has a go-live slot (or is live) on
                  the platform above.
                </span>
              </span>
            </label>
          </>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted/50 rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canComplete}
            onClick={handleComplete}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: primary }}
          >
            <CalendarClock className="size-3.5" aria-hidden />
            Complete batch — videos scheduled
          </button>
        </div>
      </div>
    </div>
  )
}
