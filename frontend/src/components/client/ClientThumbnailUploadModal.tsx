import { useRef } from 'react'
import { CheckCircle2, ImagePlus, LoaderCircle, X } from 'lucide-react'
import type { AdminVideoTicket } from '@/types/pathB'
import { useMediaUploadMutation } from '@/hooks/api/media/useMediaUploadMutation'
import { apiErrorMessage } from '@/lib/apiError'
import { studioMediaSlot } from '@/lib/studioMedia'

type Props = {
  ticket: AdminVideoTicket | null
  onClose: () => void
}

export function ClientThumbnailUploadModal({ ticket, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useMediaUploadMutation(ticket?.id ?? '')
  if (!ticket) return null
  const existing = studioMediaSlot(ticket, 'thumbnail')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal aria-labelledby="thumbnail-upload-title">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="thumbnail-upload-title" className="text-base font-bold text-slate-950">{existing ? 'Replace thumbnail' : 'Add thumbnail'}</h2>
            <p className="truncate text-xs text-slate-500">#{ticket.deliverableIndex} · {ticket.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close">
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="space-y-4 p-5">
          {existing ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="size-4" aria-hidden />
              Thumbnail v{existing.version ?? 1} is stored
            </div>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={upload.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) upload.mutate({ file, kind: 'thumbnail' }, { onSuccess: onClose })
            }}
          />
          <button
            type="button"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
          >
            {upload.isPending ? <LoaderCircle className="size-4 animate-spin text-blue-600" aria-hidden /> : <ImagePlus className="size-4 text-blue-600" aria-hidden />}
            {upload.isPending ? `Uploading ${upload.progress}%` : 'Choose JPG, PNG or WebP'}
          </button>
          {upload.isError ? <p className="text-xs text-red-600">{apiErrorMessage(upload.error, 'Could not upload this thumbnail.')}</p> : null}
        </div>
      </section>
    </div>
  )
}
