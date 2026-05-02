import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  MessageSquare,
  Video,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_SMM_QA_TASKS, type SmmQaFlagDraft } from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function SmmQaDetail() {
  const { taskId } = useParams<{ taskId: string }>()
  const { theme } = useTheme()
  const task = taskId ? MOCK_SMM_QA_TASKS[taskId] : undefined
  const videoRef = useRef<HTMLVideoElement>(null)

  const [flags, setFlags] = useState<SmmQaFlagDraft[]>(() => task?.existingFlags ?? [])
  const [generalNote, setGeneralNote] = useState('')
  const [approved, setApproved] = useState(false)

  const destructive = theme.colors.destructive

  const addFlagAtPlayhead = () => {
    const el = videoRef.current
    const t = el && !Number.isNaN(el.currentTime) ? el.currentTime : 0
    const note = window.prompt('QA note at this timestamp:')
    if (note == null || !note.trim()) return
    setFlags((prev) => [
      ...prev,
      { id: `f-${Date.now()}`, atSeconds: t, note: note.trim() },
    ])
  }

  const banner = useMemo(() => {
    if (approved) return 'Approved for client final review (prototype).'
    return null
  }, [approved])

  if (!task) {
    return (
      <>
        <ClientPageHeader title="Task not found" />
        <p className="text-muted-foreground text-sm">
          <Link to="/smm/qa" className="text-primary font-medium hover:underline">
            ← Back to video QA
          </Link>
        </p>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ClientPageHeader
          title={task.batchTitle}
          subtitle={`${task.clientName} · Updated ${formatDate(task.updatedAt)}`}
        />
        <Link
          to="/smm/qa"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All QA tasks
        </Link>
      </div>

      {banner && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            background: `${theme.colors.success}12`,
            borderColor: `${theme.colors.success}40`,
            color: theme.colors.success,
          }}
        >
          {banner}
        </div>
      )}

      <div
        className="border-border bg-background/85 grid gap-6 rounded-2xl border p-5 backdrop-blur-xl md:grid-cols-2"
        style={{
          boxShadow: `
            0 20px 60px -18px rgba(5, 9, 14, 0.14),
            0 0 0 1px rgba(255, 255, 255, 0.55) inset
          `,
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Video className="text-foreground size-5" aria-hidden />
            <h3 className="text-foreground text-sm font-semibold">Video</h3>
          </div>
          <video
            ref={videoRef}
            className="border-border bg-muted/30 aspect-[9/16] max-h-[min(420px,50vh)] w-full rounded-lg border object-contain"
            controls
            src={task.videoSrc}
          />
          <button
            type="button"
            onClick={addFlagAtPlayhead}
            className="border-border text-foreground hover:bg-muted/50 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
          >
            <AlertTriangle className="size-3.5" style={{ color: destructive }} aria-hidden />
            Flag at current playback time
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-foreground size-5" aria-hidden />
            <h3 className="text-foreground text-sm font-semibold">Thumbnail</h3>
          </div>
          <div className="border-border bg-muted/40 flex aspect-video w-full max-w-sm items-center justify-center rounded-lg border">
            <p className="text-muted-foreground px-4 text-center text-xs">
              {task.thumbnailAlt}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
              Timestamp flags
            </p>
            {flags.length === 0 ? (
              <p className="text-muted-foreground text-xs">No flags yet.</p>
            ) : (
              <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
                {flags.map((f) => (
                  <li
                    key={f.id}
                    className="border-border bg-background/80 rounded-lg border px-3 py-2"
                  >
                    <span className="text-foreground font-mono font-semibold tabular-nums">
                      {formatTimestamp(f.atSeconds)}
                    </span>
                    <span className="text-muted-foreground"> — {f.note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="general"
              className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              <MessageSquare className="size-3" aria-hidden />
              General note
            </label>
            <textarea
              id="general"
              value={generalNote}
              onChange={(e) => {
                setGeneralNote(e.target.value)
              }}
              rows={3}
              placeholder="Overall feedback not tied to one moment…"
              className="border-border bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={approved}
          onClick={() => {
            setApproved(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-[filter] disabled:opacity-60"
          style={{
            background:
              flags.length > 0 || generalNote.trim()
                ? destructive
                : theme.colors.success,
          }}
        >
          <CheckCircle className="size-4" aria-hidden />
          {flags.length > 0 || generalNote.trim()
            ? 'Send back to editor (prototype)'
            : 'Approve · send to client'}
        </button>
      </div>
      <p className="text-muted-foreground text-xs">
        If you approve with no flags, the batch moves to <strong className="text-foreground/90">client final review</strong>.
        Flags return work to the Editor in the real product.
      </p>
    </>
  )
}
