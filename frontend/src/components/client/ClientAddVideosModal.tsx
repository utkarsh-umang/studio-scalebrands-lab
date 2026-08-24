import { useRef, useState } from 'react'
import { FileVideo2, LoaderCircle, Plus, UploadCloud, X } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import { useSourceClipsUploadMutation } from '@/hooks/api/media/useSourceClipsUploadMutation'
import { apiErrorMessage } from '@/lib/apiError'

const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v'
const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024

type Props = {
  batch: AdminBatchFolder
  open: boolean
  onClose: () => void
}

export function ClientAddVideosModal({ batch, open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const upload = useSourceClipsUploadMutation(batch.id, { append: true })

  if (!open) return null

  function selectFiles(next: File[]) {
    const invalid = next.find(
      (file) => !file.type.startsWith('video/') || file.size > MAX_FILE_BYTES,
    )
    if (invalid) {
      setSelectionError(`“${invalid.name}” must be a supported video under 5 GB.`)
      return
    }
    setSelectionError(null)
    setFiles(next.slice(0, 100))
    upload.reset()
  }

  const complete = upload.progress.filter((item) => item.status === 'complete').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <section className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal aria-labelledby="add-videos-title">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="add-videos-title" className="text-base font-bold text-slate-950">Add videos</h2>
            <p className="text-xs text-slate-500">{batch.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close">
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="space-y-4 p-5">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={VIDEO_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              selectFiles(Array.from(event.target.files ?? []))
              event.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
          >
            <Plus className="size-4 text-blue-600" aria-hidden />
            Choose clipped raw videos
          </button>
          {files.length ? (
            <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}`} className="flex items-center gap-3 px-3 py-2.5">
                  <FileVideo2 className="size-4 shrink-0 text-blue-600" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">{file.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {upload.progress[index]?.status === 'uploading'
                      ? `${upload.progress[index]?.percent}%`
                      : upload.progress[index]?.status === 'complete'
                        ? 'Ready'
                        : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {selectionError ? <p className="text-xs text-red-600">{selectionError}</p> : null}
          {upload.isError ? (
            <p className="text-xs text-red-600">{apiErrorMessage(upload.error, 'Could not add these videos.')}</p>
          ) : null}
          <button
            type="button"
            disabled={!files.length || upload.isPending}
            onClick={() => {
              upload.mutate(files, { onSuccess: onClose })
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {upload.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <UploadCloud className="size-4" aria-hidden />}
            {upload.isPending ? `Uploading ${complete} of ${files.length}` : `Add ${files.length || ''} ${files.length === 1 ? 'video' : 'videos'}`}
          </button>
        </div>
      </section>
    </div>
  )
}
