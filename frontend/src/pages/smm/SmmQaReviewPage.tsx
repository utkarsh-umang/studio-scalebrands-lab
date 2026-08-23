import {
  ArrowLeft,
  Check,
  Clock3,
  ImagePlus,
  LoaderCircle,
  MessageSquareText,
  Paperclip,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ClientQaRequest, SubmitSmmQaRequest } from '@/client'
import { useAuth } from '@/auth'
import { ClientTitleField } from '@/components/client/ClientTitleField'
import { QaReviewAttachment } from '@/components/qa/QaReviewAttachment'
import { SmmQaTitleField } from '@/components/smm/SmmQaTitleField'
import { useQaAttachmentUploadMutation } from '@/hooks/api/media/useQaAttachmentUploadMutation'
import { useMediaPlaybackQuery } from '@/hooks/api/media/useMediaPlaybackQuery'
import {
  useAppendQaCommentMutation,
  useSubmitSmmQaMutation,
} from '@/hooks/api/pathB/useSmmQaMutations'
import { useUpdateProductionMutation } from '@/hooks/api/pathB/useProductionMutations'
import {
  useAppendClientQaCommentMutation,
  useClientQaDecisionMutation,
} from '@/hooks/api/pathB/useClientQaMutations'
import { useRoleWorkspace } from '@/hooks/api/workspace/useRoleWorkspace'
import { apiErrorMessage } from '@/lib/apiError'
import { videoNeedsClientFinalReview } from '@/lib/clientBoard'
import { videoNeedsSmmQa } from '@/lib/smmBoard'
import { studioMediaSlot } from '@/lib/studioMedia'
import type { QaComment } from '@/types/pathB'

const ATTACHMENT_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,video/x-m4v'
const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60)
  const remainder = whole % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function authorLabel(comment: QaComment, viewerRole: 'smm' | 'client'): string {
  if (comment.authorRole === viewerRole) {
    return viewerRole === 'smm' ? 'You · internal' : 'You'
  }
  if (comment.authorRole === 'client') return 'Client'
  if (comment.authorRole === 'editor') return 'Editor'
  return 'SMM · internal'
}

function ReviewComment({
  comment,
  onSeek,
  viewerRole,
}: {
  comment: QaComment
  onSeek: (seconds: number) => void
  viewerRole: 'smm' | 'client'
}) {
  const timestamped = comment.atSeconds != null
  return (
    <li
      className={[
        'rounded-2xl border p-3.5 shadow-sm',
        comment.deprecated
          ? 'border-dashed border-slate-200 bg-slate-50 opacity-75'
          : 'border-slate-200 bg-white',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
          {comment.authorRole === 'client' ? 'CL' : comment.authorRole === 'editor' ? 'ED' : 'QA'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-semibold text-slate-900">{authorLabel(comment, viewerRole)}</span>
            <span className="text-[10px] text-slate-400">
              {new Date(comment.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            {comment.deprecated ? (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                Addressed on v{comment.assetVersion}
              </span>
            ) : null}
          </div>
          {timestamped ? (
            <button
              type="button"
              onClick={() => {
                onSeek(comment.atSeconds ?? 0)
              }}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 font-mono text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Clock3 className="size-3" aria-hidden />
              {formatTime(comment.atSeconds ?? 0)}
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

type Props = {
  mode?: 'smm' | 'client'
}

export function SmmQaReviewPage({ mode = 'smm' }: Props) {
  const { user } = useAuth()
  const { videoTicketId } = useParams<{ videoTicketId: string }>()
  const navigate = useNavigate()
  const { clients, batches, videos, isWorkspaceLoading } = useRoleWorkspace()
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoStageRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [pinToPlayhead, setPinToPlayhead] = useState(true)
  const [playhead, setPlayhead] = useState(0)
  const [duration, setDuration] = useState(0)
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const ticket = videos.find((video) => video.id === videoTicketId)
  const batch = batches.find((item) => item.id === ticket?.batchId)
  const client = clients.find((item) => item.id === ticket?.clientId)
  const studioVideo = studioMediaSlot(ticket, 'video')
  const playback = useMediaPlaybackQuery(studioVideo?.assetId)
  const comments = useMemo(() => {
    const visible = (ticket?.qaCommentHistory ?? []).filter(
      (comment) =>
        comment.slot === 'video' &&
        (mode === 'smm' || comment.authorRole === 'client'),
    )
    return visible.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
  }, [mode, ticket?.qaCommentHistory])
  const activeCommentCount = comments.filter((comment) => !comment.deprecated).length

  const appendComment = useAppendQaCommentMutation(videoTicketId ?? '')
  const appendClientComment = useAppendClientQaCommentMutation()
  const uploadAttachment = useQaAttachmentUploadMutation(videoTicketId ?? '')
  const submitQa = useSubmitSmmQaMutation(videoTicketId ?? '')
  const submitClientQa = useClientQaDecisionMutation()
  const updateProduction = useUpdateProductionMutation(videoTicketId ?? '')
  const canAct = Boolean(
    ticket &&
      (mode === 'smm'
        ? videoNeedsSmmQa(ticket)
        : videoNeedsClientFinalReview(ticket)),
  )
  const posting =
    (mode === 'smm' ? appendComment.isPending : appendClientComment.isPending) ||
    uploadAttachment.isPending
  const backHref = mode === 'smm' ? '/smm/board' : '/client/board'

  const roleAllowed =
    mode === 'smm'
      ? user?.role === 'employee' && user.employeeKind === 'smm'
      : user?.role === 'client'
  if (!user || !roleAllowed) {
    return <Navigate to="/login" replace />
  }

  if (isWorkspaceLoading && !ticket) {
    return <p className="text-muted-foreground text-sm">Loading review workspace…</p>
  }

  if (!ticket || !batch) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Review not found</p>
        <p className="mt-1 text-sm text-slate-500">This video is not assigned to your workspace.</p>
        <Link to={backHref} className="mt-4 inline-flex text-sm font-semibold text-blue-600">
          Back to workspace
        </Link>
      </section>
    )
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    const oversized = selected.find((file) => file.size > MAX_ATTACHMENT_BYTES)
    if (oversized) {
      setFileError(`${oversized.name} is larger than 50 MB.`)
      return
    }
    setFileError(null)
    setFiles((current) => [...current, ...selected].slice(0, 4))
  }

  async function postComment() {
    const body = draft.trim()
    if (!body || !canAct || posting) return
    try {
      const uploaded = []
      for (const file of files) {
        uploaded.push(await uploadAttachment.mutateAsync(file))
      }
      const commentBody = {
        body,
        atSeconds: pinToPlayhead ? Math.max(0, Math.round(playhead)) : undefined,
        attachmentAssetIds: uploaded.map((item) => item.assetId),
      }
      if (mode === 'smm') {
        await appendComment.mutateAsync(commentBody)
      } else {
        await appendClientComment.mutateAsync({
          videoTicketId: videoTicketId ?? '',
          body: commentBody,
        })
      }
      setDraft('')
      setFiles([])
      setFileError(null)
    } catch {
      // Mutation state renders the actionable API error below the composer.
    }
  }

  function seekTo(seconds: number) {
    if (!videoRef.current) return
    videoRef.current.currentTime = seconds
    videoRef.current.pause()
    setPlayhead(seconds)
    videoStageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const commentError = mode === 'smm' ? appendComment.error : appendClientComment.error
  const decisionError = mode === 'smm' ? submitQa.error : submitClientQa.error
  const mutationError = commentError
    ? apiErrorMessage(commentError, 'Could not post this comment.')
    : uploadAttachment.isError
      ? apiErrorMessage(uploadAttachment.error, 'Could not upload the attachment.')
      : decisionError
        ? apiErrorMessage(decisionError, 'Could not submit this review decision.')
        : null
  const decisionPending = mode === 'smm' ? submitQa.isPending : submitClientQa.isPending

  function requestChanges() {
    if (mode === 'smm') {
      submitQa.mutate(
        { action: SubmitSmmQaRequest.action.SEND_BACK },
        { onSuccess: () => navigate(backHref) },
      )
      return
    }
    submitClientQa.mutate(
      {
        videoTicketId: videoTicketId ?? '',
        body: { action: ClientQaRequest.action.REJECT },
      },
      { onSuccess: () => navigate(backHref) },
    )
  }

  function approveVideo() {
    if (mode === 'smm') {
      submitQa.mutate(
        { action: SubmitSmmQaRequest.action.APPROVE },
        { onSuccess: () => navigate(backHref) },
      )
      return
    }
    submitClientQa.mutate(
      {
        videoTicketId: videoTicketId ?? '',
        body: { action: ClientQaRequest.action.APPROVE },
      },
      { onSuccess: () => navigate(backHref) },
    )
  }

  return (
    <div className="-mx-1 -my-2 lg:-mx-3">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            to={backHref}
            aria-label="Back to workspace"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-slate-950"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
                  mode === 'smm'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800',
                ].join(' ')}
              >
                {mode === 'smm' ? 'Internal QA' : 'Your final review'}
              </span>
              <span className="text-xs text-slate-500">
                Video #{ticket.deliverableIndex ?? 1} of {batch.videoCount} · v{studioVideo?.version ?? ticket.assetVersions?.video ?? 1}
              </span>
            </div>
            <h1 className="mt-2 truncate font-[family-name:var(--heading)] text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              {ticket.editorPublishTitle?.trim() || ticket.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {client?.displayName ?? 'Client'} · {batch.title} ·{' '}
              {mode === 'smm'
                ? 'Pause anywhere and leave a precise note.'
                : 'Approve the video or pause anywhere to request a change.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canAct || decisionPending || activeCommentCount === 0}
            onClick={requestChanges}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Undo2 className="size-4" aria-hidden />
            Request changes
          </button>
          <button
            type="button"
            disabled={!canAct || decisionPending}
            onClick={approveVideo}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden />
            {mode === 'smm' ? 'Approve for client' : 'Approve video'}
          </button>
        </div>
      </header>

      {!canAct ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {mode === 'smm'
            ? 'This video is no longer awaiting internal QA.'
            : 'This video is no longer waiting for your review.'}{' '}
          The review remains readable, but new comments and decisions are locked.
        </div>
      ) : null}

      {mutationError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {mutationError}
        </p>
      ) : null}

      <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="min-w-0 space-y-4">
          <div ref={videoStageRef} className="overflow-hidden rounded-2xl bg-[#080b12] shadow-xl ring-1 ring-black/10">
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
                  onLoadedMetadata={(event) => {
                    setDuration(event.currentTarget.duration)
                  }}
                  onTimeUpdate={(event) => {
                    setPlayhead(event.currentTarget.currentTime)
                  }}
                />
              ) : (
                <div className="text-center text-sm text-slate-400">
                  <p>Video preview unavailable.</p>
                  <p className="mt-1 text-xs">A Studio-uploaded finished video is required for timed review.</p>
                </div>
              )}
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Leave feedback</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Click into the comment box to pause the video. The note will be pinned to the current frame.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1.5 font-mono text-xs font-semibold text-white">
                {formatTime(playhead)} / {formatTime(duration)}
              </span>
            </div>

            <textarea
              value={draft}
              onFocus={() => videoRef.current?.pause()}
              onChange={(event) => setDraft(event.target.value)}
              disabled={!canAct}
              rows={3}
              placeholder="What should change at this moment?"
              className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
            />

            {files.length ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {file.type.startsWith('video/') ? <Paperclip className="size-4 shrink-0 text-slate-500" aria-hidden /> : <ImagePlus className="size-4 shrink-0 text-slate-500" aria-hidden />}
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Remove ${file.name}`}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {fileError ? <p className="mt-2 text-xs text-red-600">{fileError}</p> : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={pinToPlayhead}
                    onChange={(event) => setPinToPlayhead(event.target.checked)}
                    className="size-3.5 accent-blue-600"
                  />
                  <Clock3 className="size-3.5" aria-hidden />
                  {pinToPlayhead ? `Pinned to ${formatTime(playhead)}` : 'General comment'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ATTACHMENT_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
                <button
                  type="button"
                  disabled={!canAct || files.length >= 4}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Paperclip className="size-3.5" aria-hidden />
                  Add image, GIF or video
                </button>
                <span className="text-[10px] text-slate-400">Up to 4 files · 50 MB each</span>
              </div>
              <button
                type="button"
                disabled={!canAct || !draft.trim() || posting}
                onClick={() => void postComment()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {posting ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                {posting ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </section>

          {mode === 'smm' &&
          (batch.titleOwnerKind === 'smm' || !ticket.editorPublishTitle?.trim()) ? (
            <SmmQaTitleField
              ticket={ticket}
              pending={updateProduction.isPending}
              error={updateProduction.isError ? apiErrorMessage(updateProduction.error, 'Could not save the title.') : null}
              onSave={(title) => updateProduction.mutate({ editorPublishTitle: title })}
            />
          ) : null}
          {mode === 'client' && batch.titleOwnerKind === 'client' ? (
            <ClientTitleField ticket={ticket} />
          ) : null}
        </main>

        <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-0 lg:h-[calc(100dvh-4rem)] lg:max-h-[900px]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-slate-500" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-900">Review comments</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {comments.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 overscroll-contain">
            {comments.length ? (
              <ol className="space-y-3">
                {comments.map((comment) => (
                  <ReviewComment
                    key={comment.id}
                    comment={comment}
                    onSeek={seekTo}
                    viewerRole={mode}
                  />
                ))}
              </ol>
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center px-8 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <MessageSquareText className="size-5" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">No comments yet</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Pause the video, write below the player, and the first note will appear here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
