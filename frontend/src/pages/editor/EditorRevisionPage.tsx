import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileVideo2,
  LoaderCircle,
  MessageSquareText,
  Send,
  UploadCloud,
} from 'lucide-react'
import { useMemo, useRef, type ChangeEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/auth'
import { QaReviewAttachment } from '@/components/qa/QaReviewAttachment'
import { useMediaUploadMutation } from '@/hooks/api/media/useMediaUploadMutation'
import { useMediaPlaybackQuery } from '@/hooks/api/media/useMediaPlaybackQuery'
import { useResubmitToSmmQaMutation } from '@/hooks/api/pathB/useSmmQaMutations'
import { useRoleWorkspace } from '@/hooks/api/workspace/useRoleWorkspace'
import { apiErrorMessage } from '@/lib/apiError'
import { videoEditorQaReturn } from '@/lib/editorBoard'
import { activeCommentsForSlot } from '@/lib/qaComments'
import { studioMediaSlot } from '@/lib/studioMedia'
import type { QaComment } from '@/types/pathB'

const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-m4v'

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60)
  const remainder = whole % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function roleLabel(role: QaComment['authorRole']): string {
  if (role === 'client') return 'Client'
  if (role === 'smm') return 'SMM · internal'
  return 'Editor'
}

function FeedbackComment({
  comment,
  onSeek,
}: {
  comment: QaComment
  onSeek: (seconds: number) => void
}) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={[
            'flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
            comment.authorRole === 'client'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-amber-50 text-amber-700',
          ].join(' ')}
        >
          {comment.authorRole === 'client' ? 'CL' : 'QA'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-semibold text-slate-900">
              {roleLabel(comment.authorRole)}
            </span>
            <span className="text-[10px] text-slate-400">
              {new Date(comment.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
              v{comment.assetVersion}
            </span>
          </div>
          {comment.atSeconds != null ? (
            <button
              type="button"
              onClick={() => onSeek(comment.atSeconds ?? 0)}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 font-mono text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Clock3 className="size-3" aria-hidden />
              {formatTime(comment.atSeconds)}
            </button>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {comment.body}
          </p>
          {comment.attachments?.length ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {comment.attachments.map((attachment) => (
                <QaReviewAttachment
                  key={attachment.assetId}
                  assetId={attachment.assetId}
                  fileName={attachment.fileName}
                  contentType={attachment.contentType}
                  compact
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function EditorRevisionPage() {
  const { user } = useAuth()
  const { videoTicketId } = useParams<{ videoTicketId: string }>()
  const navigate = useNavigate()
  const { clients, batches, videos, isWorkspaceLoading } = useRoleWorkspace()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ticket = videos.find((item) => item.id === videoTicketId)
  const batch = batches.find((item) => item.id === ticket?.batchId)
  const client = clients.find((item) => item.id === ticket?.clientId)
  const studioVideo = studioMediaSlot(ticket, 'video')
  const playback = useMediaPlaybackQuery(studioVideo?.assetId)
  const upload = useMediaUploadMutation(videoTicketId ?? '')
  const resubmit = useResubmitToSmmQaMutation(videoTicketId ?? '')

  const comments = useMemo(
    () =>
      activeCommentsForSlot(ticket?.qaCommentHistory, 'video').sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [ticket?.qaCommentHistory],
  )
  const feedbackVersion = comments.reduce(
    (latest, comment) => Math.max(latest, comment.assetVersion),
    0,
  )
  const currentVersion = studioVideo?.version ?? ticket?.assetVersions?.video ?? 0
  const replacementReady = Boolean(
    studioVideo?.assetId && feedbackVersion > 0 && currentVersion > feedbackVersion,
  )
  const canAct = Boolean(ticket && videoEditorQaReturn(ticket))

  if (!user || user.role !== 'employee' || user.employeeKind !== 'editor') {
    return <Navigate to="/login" replace />
  }

  if (isWorkspaceLoading && !ticket) {
    return <p className="text-sm text-slate-500">Loading revision workspace…</p>
  }

  if (!ticket || !batch) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Revision not found</p>
        <Link to="/editor/board" className="mt-4 inline-flex text-sm font-semibold text-blue-600">
          Back to editor board
        </Link>
      </section>
    )
  }

  const sourceLabel =
    ticket.lastRevisionRequestedBy === 'client'
      ? 'Client changes requested'
      : 'Internal QA changes requested'
  const mutationError = upload.isError
    ? apiErrorMessage(upload.error, 'Could not upload the replacement video.')
    : resubmit.isError
      ? apiErrorMessage(resubmit.error, 'Could not send the replacement to SMM QA.')
      : null

  function handleReplacement(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !canAct) return
    upload.mutate({ file, kind: 'video' })
  }

  function seekTo(seconds: number) {
    if (!videoRef.current) return
    videoRef.current.currentTime = seconds
    videoRef.current.pause()
    videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="-mx-1 -my-2 lg:-mx-3">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            to="/editor/board"
            aria-label="Back to editor board"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-slate-950"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-800">
                {sourceLabel}
              </span>
              <span className="text-xs text-slate-500">
                Video #{ticket.deliverableIndex ?? 1} · feedback on v{feedbackVersion || currentVersion}
              </span>
            </div>
            <h1 className="mt-2 truncate font-[family-name:var(--heading)] text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              {ticket.editorPublishTitle?.trim() || ticket.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {client?.displayName ?? 'Client'} · {batch.title} · Review every note, upload a new cut, then return it to SMM QA.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!canAct || !replacementReady || resubmit.isPending}
          onClick={() => {
            resubmit.mutate(
              { bumpVideoVersion: false },
              { onSuccess: () => navigate('/editor/board') },
            )
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {resubmit.isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          {resubmit.isPending ? 'Sending…' : 'Send replacement to SMM QA'}
        </button>
      </header>

      {!canAct ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This video is no longer waiting on an editor revision. The feedback remains readable.
        </div>
      ) : null}
      {mutationError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {mutationError}
        </p>
      ) : null}

      <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl bg-[#080b12] shadow-xl ring-1 ring-black/10">
            <div className="relative flex aspect-video max-h-[68vh] min-h-[360px] items-center justify-center bg-black">
              {playback.isPending ? (
                <LoaderCircle className="size-6 animate-spin text-white" aria-label="Loading video" />
              ) : playback.data?.url ? (
                <video
                  ref={videoRef}
                  src={playback.data.url}
                  title={studioVideo?.name ?? ticket.title}
                  className="size-full bg-black object-contain"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <p className="text-sm text-slate-400">Video preview unavailable.</p>
              )}
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className={[
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  replacementReady ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700',
                ].join(' ')}>
                  {replacementReady ? <CheckCircle2 className="size-5" aria-hidden /> : <FileVideo2 className="size-5" aria-hidden />}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    {replacementReady ? `Replacement v${currentVersion} is ready` : `Upload a replacement for v${feedbackVersion || currentVersion}`}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {replacementReady
                      ? 'The new cut is stored privately in Studio. Send it to SMM QA when you are ready.'
                      : 'The handoff stays locked until a completed new video version exists in Studio storage.'}
                  </p>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={VIDEO_ACCEPT}
                  className="sr-only"
                  disabled={!canAct || upload.isPending}
                  onChange={handleReplacement}
                />
                <button
                  type="button"
                  disabled={!canAct || upload.isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {upload.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <UploadCloud className="size-4" aria-hidden />}
                  {upload.isPending ? `Uploading ${upload.progress}%` : replacementReady ? 'Replace again' : 'Upload new cut'}
                </button>
              </div>
            </div>
          </section>
        </main>

        <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-0 lg:h-[calc(100dvh-4rem)] lg:max-h-[900px]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-slate-500" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-900">Requested changes</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {comments.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 overscroll-contain">
            {comments.length ? (
              <ol className="space-y-3">
                {comments.map((comment) => (
                  <FeedbackComment key={comment.id} comment={comment} onSeek={seekTo} />
                ))}
              </ol>
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center px-8 text-center">
                <Clock3 className="size-5 text-slate-400" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-slate-800">No active feedback</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
