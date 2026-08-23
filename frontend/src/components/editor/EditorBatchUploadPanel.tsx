import { ArrowRight, CheckCircle2, FileVideo2, Image, LoaderCircle, UploadCloud } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { useMediaUploadMutation } from '@/hooks/api/media/useMediaUploadMutation'
import { apiErrorMessage } from '@/lib/apiError'
import { studioMediaSlot } from '@/lib/studioMedia'
import { useSubmitToSmmQaMutation } from '@/hooks/api/pathB/useProductionMutations'

type RowProps = {
  batch: AdminBatchFolder
  ticket: AdminVideoTicket
  includeThumbnail: boolean
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

function UploadRow({ batch, ticket, includeThumbnail }: RowProps) {
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
  const canSendToQa = stillWithEditor && missingEditorAssets.length === 0
  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[68px_minmax(0,1fr)_auto] md:items-center md:px-5">
      <span className="text-[11px] font-bold tabular-nums text-slate-400">
        #{String(ticket.deliverableIndex ?? '—').padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-900">{ticket.title}</p>
        <p className="mt-1 text-[10px] text-slate-500">
          {video ? `Video v${video.version ?? 1} stored in Studio` : 'Finished video required'}
          {includeThumbnail
            ? thumbnail
              ? ` · Thumbnail v${thumbnail.version ?? 1} stored`
              : ' · Thumbnail required'
            : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-2 md:justify-end">
        {stillWithEditor ? (
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
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" aria-hidden />
            With SMM QA
          </span>
        )}
      </div>
      {submitToSmmQa.isError ? (
        <p className="text-xs text-red-600 md:col-start-2 md:col-end-4 md:text-right" role="alert">
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
  const deliverables = tickets
    .filter((ticket) => ticket.deliverableIndex != null && ticket.deliverableIndex > 0)
    .sort((a, b) => (a.deliverableIndex ?? 0) - (b.deliverableIndex ?? 0))
  const includeThumbnail = batch.thumbnailOwnerKind === 'editor'
  const uploadedCount = deliverables.filter((ticket) => studioMediaSlot(ticket, 'video')).length
  const withQaCount = deliverables.filter(
    (ticket) => ticket.owner === 'smm' && ticket.stageLabel.toLowerCase().includes('qa'),
  ).length
  const allWithQa = deliverables.length > 0 && withQaCount === deliverables.length

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            {allWithQa ? (
              <CheckCircle2 className="size-4.5" aria-hidden />
            ) : (
              <UploadCloud className="size-4.5" aria-hidden />
            )}
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-950">
              {allWithQa
                ? 'Finished files are with SMM QA'
                : 'Upload finished production files'}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
              {allWithQa
                ? 'Every finished video has been handed off. You will be notified here if QA requests changes.'
                : 'Upload one finished video for every source clip. Files go directly into private Studio storage; no shared Drive folder is needed.'}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
          {allWithQa
            ? `${withQaCount} of ${deliverables.length} in QA`
            : `${uploadedCount} of ${deliverables.length} videos stored`}
        </span>
      </header>
      {deliverables.length > 0 ? (
        <div>
          {deliverables.map((ticket) => (
            <UploadRow
              key={ticket.id}
              batch={batch}
              ticket={ticket}
              includeThumbnail={includeThumbnail}
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
