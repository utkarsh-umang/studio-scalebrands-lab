import { useState } from 'react'
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Send,
  Video,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_EDITOR_TASKS, type EditorTaskDetail as EditorTaskDetailModel } from '@mockData/index'
import { ClientPageHeader, formatDate, formatDateTime } from '@/pages/client/clientPageUtils'

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function EditorTaskDetail() {
  const { taskId } = useParams<{ taskId: string }>()
  const { theme } = useTheme()
  const task: EditorTaskDetailModel | undefined =
    taskId && MOCK_EDITOR_TASKS[taskId] ? MOCK_EDITOR_TASKS[taskId] : undefined

  const [mockBanner, setMockBanner] = useState<string | null>(null)

  if (!task) {
    return (
      <>
        <ClientPageHeader title="Task not found" />
        <p className="text-muted-foreground text-sm">
          <Link
            to="/editor/tasks"
            className="text-primary font-medium hover:underline"
          >
            ← Back to my tasks
          </Link>
        </p>
      </>
    )
  }

  const primary = theme.colors.primary
  const destructive = theme.colors.destructive

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ClientPageHeader
          title={task.batchTitle}
          subtitle={`${task.accountLabel} · ${task.stageLabel} · Updated ${formatDate(task.updatedAt)}`}
        />
        <Link
          to="/editor/tasks"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All tasks
        </Link>
      </div>

      {task.deadline && (
        <div
          className="border-border bg-background/85 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 text-sm backdrop-blur-xl"
          style={{
            borderColor: `${primary}30`,
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          <Clock className="text-foreground size-4 shrink-0" aria-hidden />
          <span className="text-foreground font-medium">Deadline</span>
          <span className="text-muted-foreground">
            {formatDateTime(`${task.deadline}T17:00:00.000Z`)}
          </span>
        </div>
      )}

      {mockBanner && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            background: `${primary}10`,
            borderColor: `${primary}35`,
            color: theme.colors.foreground,
          }}
        >
          {mockBanner}
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
          {task.previewVideoSrc ? (
            <video
              className="border-border bg-muted/30 aspect-[9/16] max-h-[min(420px,50vh)] w-full rounded-lg border object-contain"
              controls
              src={task.previewVideoSrc}
            />
          ) : (
            <p className="text-muted-foreground text-sm">No preview URL (mock).</p>
          )}
          {task.footageUrl && (
            <a
              href={task.footageUrl}
              className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              {task.footageLabel ?? 'Open source footage link'}
            </a>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-foreground size-5" aria-hidden />
            <h3 className="text-foreground text-sm font-semibold">Thumbnail</h3>
          </div>
          <div
            className="border-border bg-muted/20 flex aspect-video w-full max-w-md flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6"
            style={{ borderColor: `${primary}25` }}
          >
            <ImageIcon className="text-muted-foreground size-10" aria-hidden />
            <p className="text-muted-foreground text-center text-xs">
              {task.thumbnailAlt ?? 'Thumbnail frame'}
            </p>
            <p className="text-muted-foreground text-center text-[10px]">
              Placeholder — v1 uses external tools; no in-app upload.
            </p>
          </div>
          {(task.thumbnailTitle || task.videoTitle) && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
                Approved copy (from SMM)
              </p>
              {task.thumbnailTitle && (
                <p>
                  <span className="text-muted-foreground">Thumb title: </span>
                  <span className="text-foreground font-medium">
                    {task.thumbnailTitle}
                  </span>
                </p>
              )}
              {task.videoTitle && (
                <p>
                  <span className="text-muted-foreground">Video title: </span>
                  <span className="text-foreground font-medium">{task.videoTitle}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {task.status === 'qa_flagged' && task.qaFlags.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="size-5"
              style={{ color: destructive }}
              aria-hidden
            />
            <h3 className="text-foreground text-base font-semibold">
              SMM QA flags
            </h3>
          </div>
          <div
            className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
            style={{
              boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
            }}
          >
            <ul className="divide-border divide-y">
              {task.qaFlags.map((flag, i) => (
                <li key={flag.id} className="px-5 py-4">
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
                    {flag.kind === 'timestamp'
                      ? `Timestamp · ${flag.atSeconds != null ? formatTimestamp(flag.atSeconds) : '—'}`
                      : `General note · Flag ${i + 1}`}
                  </p>
                  <p className="text-foreground mt-1 text-sm leading-snug">{flag.note}</p>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              setMockBanner(
                'Resubmitted for SMM re-review (mock — connect API later).',
              )
            }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${theme.colors.secondary})`,
              boxShadow: `0 12px 32px -12px ${primary}88`,
            }}
          >
            <Send className="size-4" aria-hidden />
            Resubmit for SMM QA
          </button>
        </section>
      )}

      {task.status === 'editing' && (
        <section className="space-y-3">
          <p className="text-muted-foreground max-w-2xl text-sm">
            When your cut and thumbnail are ready, send to the Social Media Manager for
            video + thumbnail QA — not to the client.
          </p>
          <button
            type="button"
            onClick={() => {
              setMockBanner(
                'Submitted to SMM for QA (mock — connect API later).',
              )
            }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${theme.colors.secondary})`,
              boxShadow: `0 12px 32px -12px ${primary}88`,
            }}
          >
            <Send className="size-4" aria-hidden />
            Submit to SMM QA
          </button>
        </section>
      )}

      {task.status === 'smm_qa' && (
        <div
          className="border-border bg-background/85 rounded-xl border px-4 py-3 text-sm backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          <p className="text-muted-foreground">
            This deliverable is <strong className="text-foreground">with SMM for QA</strong>.
            You will get it back here if they raise flags.
          </p>
        </div>
      )}
    </>
  )
}
