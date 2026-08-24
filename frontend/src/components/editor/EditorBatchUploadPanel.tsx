import { ArrowRight, CheckCircle2, FileVideo2, Image, LoaderCircle, UploadCloud, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { useMediaUploadMutation } from '@/hooks/api/media/useMediaUploadMutation'
import { apiErrorMessage } from '@/lib/apiError'
import { studioMediaSlot } from '@/lib/studioMedia'
import { useSubmitToSmmQaMutation } from '@/hooks/api/pathB/useProductionMutations'
import { videoEditorQaReturn } from '@/lib/editorBoard'

type RowProps = {
  batch: AdminBatchFolder
  ticket: AdminVideoTicket
  includeThumbnail: boolean
  onOpenRevision: (ticketId: string) => void
}

function UploadButton({
  ticket,
  kind,
  ready,
}: {
  ticket: AdminVideoTicket
  kind: 'video' | 'thumbnail'
  ready: boolean
}) {
  const upload = useMediaUploadMutation(ticket.id)
  const inputId = `${ticket.id}-${kind}-upload`
  const Icon = kind === 'video' ? FileVideo2 : Image
  return (
    <div className="min-w-0">
      <input
        id={inputId}
        type="file"
        accept={kind === 'video' ? 'video/mp4,video/quicktime,video/webm,video/x-m4v' : 'image/jpeg,image/png,image/webp'}
        className="sr-only"
        disabled={upload.isPending}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) upload.mutate({ file, kind })
          event.currentTarget.value = ''
        }}
      />
      <label
        htmlFor={inputId}
        className={[
          'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-colors',
          ready
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700',
          upload.isPending ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        {upload.isPending ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        ) : ready ? (
          <CheckCircle2 className="size-3.5" aria-hidden />
        ) : (
          <Icon className="size-3.5" aria-hidden />
        )}
        {upload.isPending
          ? `${upload.progress}%`
          : ready
            ? `Replace ${kind}`
            : `Upload ${kind}`}
      </label>
      {upload.isError ? (
        <p className="mt-1 max-w-40 text-[10px] leading-snug text-red-600" role="alert">
          {apiErrorMessage(upload.error, `Could not upload this ${kind}.`)}
        </p>
      ) : null}
    </div>
  )
}

function ticketStatus(ticket: AdminVideoTicket): string {
  if (ticket.owner === 'smm') return 'With SMM QA'
  if (ticket.owner === 'client') return 'With client'
  if (ticket.owner === 'scheduling') return 'Scheduling'
  if (ticket.owner === 'done') return 'Complete'
  return ticket.stageLabel
}

function UploadRow({ batch, ticket, includeThumbnail, onOpenRevision }: RowProps) {
  const video = studioMediaSlot(ticket, 'video')
  const thumbnail = studioMediaSlot(ticket, 'thumbnail')
  const submitToSmmQa = useSubmitToSmmQaMutation(ticket.id)
  const missingEditorAssets = [
    !video ? 'finished video' : null,
    batch.thumbnailOwnerKind === 'editor' && !thumbnail ? 'thumbnail' : null,
    batch.titleOwnerKind === 'editor' && !ticket.editorPublishTitle?.trim()
      ? 'title'
      : null,
  ].filter(Boolean)
  const stillWithEditor = ticket.owner === 'editor'
  const needsRevision = videoEditorQaReturn(ticket)
  const canSendToQa = stillWithEditor && missingEditorAssets.length === 0
  return (
    <div className="space-y-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 shrink-0 text-[11px] font-bold tabular-nums text-slate-400">
          #{String(ticket.deliverableIndex ?? '—').padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900">{ticket.title}</p>
          <p className="mt-1 text-[10px] text-slate-500">
            {video ? `Video v${video.version ?? 1} stored` : 'Finished video required'}
            {includeThumbnail
              ? thumbnail
                ? ` · Thumbnail v${thumbnail.version ?? 1} stored`
                : ' · Thumbnail required'
              : ''}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        {needsRevision ? (
          <button
            type="button"
            onClick={() => onOpenRevision(ticket.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <Wrench className="size-3.5" aria-hidden />
            Open QA fix
          </button>
        ) : stillWithEditor ? (
          <>
            <UploadButton ticket={ticket} kind="video" ready={Boolean(video)} />
            {includeThumbnail ? (
              <UploadButton ticket={ticket} kind="thumbnail" ready={Boolean(thumbnail)} />
            ) : null}
            <button
              type="button"
              disabled={!canSendToQa || submitToSmmQa.isPending}
              onClick={() => submitToSmmQa.mutate()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
              title={
                canSendToQa
                  ? 'Send this finished video to SMM QA'
                  : `Still required: ${missingEditorAssets.join(', ')}`
              }
            >
              {submitToSmmQa.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="size-3.5" aria-hidden />
              )}
              {submitToSmmQa.isPending ? 'Sending…' : 'Send to SMM QA'}
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-[11px] font-semibold text-slate-700">
            <CheckCircle2 className="size-3.5" aria-hidden />
            {ticketStatus(ticket)}
          </span>
        )}
      </div>
      {submitToSmmQa.isError ? (
        <p className="text-xs text-red-600" role="alert">
          {apiErrorMessage(submitToSmmQa.error, 'Could not send this video to SMM QA.')}
        </p>
      ) : null}
    </div>
  )
}

type Props = {
  batch: AdminBatchFolder
  tickets: AdminVideoTicket[]
}

export function EditorBatchUploadPanel({ batch, tickets }: Props) {
  const navigate = useNavigate()
  const deliverables = tickets
    .filter((ticket) => ticket.deliverableIndex != null && ticket.deliverableIndex > 0)
    .sort((a, b) => (a.deliverableIndex ?? 0) - (b.deliverableIndex ?? 0))
  const includeThumbnail = batch.thumbnailOwnerKind === 'editor'
  const editorCount = deliverables.filter(
    (ticket) => ticket.owner === 'editor' && !videoEditorQaReturn(ticket),
  ).length
  const revisionCount = deliverables.filter(videoEditorQaReturn).length
  const reviewCount = deliverables.filter(
    (ticket) => ticket.owner === 'smm' || ticket.owner === 'client',
  ).length
  const completeCount = deliverables.filter(
    (ticket) => ticket.owner === 'scheduling' || ticket.owner === 'done',
  ).length

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <UploadCloud className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-bold text-slate-950">Production workspace</h2>
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          {revisionCount ? `${revisionCount} fixes · ` : ''}{editorCount} editing · {reviewCount} review · {completeCount} approved
        </p>
      </header>
      {deliverables.length > 0 ? (
        <div className="max-h-[34rem] overflow-y-auto overscroll-contain">
          {deliverables.map((ticket) => (
            <UploadRow
              key={ticket.id}
              batch={batch}
              ticket={ticket}
              includeThumbnail={includeThumbnail}
              onOpenRevision={(ticketId) => navigate(`/editor/revisions/${ticketId}`)}
            />
          ))}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          Individual production tickets will appear after the clip set is approved.
        </p>
      )}
    </section>
  )
}
