import { useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  FileVideo2,
  LoaderCircle,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import { apiErrorMessage } from '@/lib/apiError'
import { useSourceClipsUploadMutation } from '@/hooks/api/media/useSourceClipsUploadMutation'

type Props = {
  batch: AdminBatchFolder
}

const MAX_FILES = 100
const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v']

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function isSupportedVideo(file: File) {
  const lowercaseName = file.name.toLowerCase()
  return (
    file.type.startsWith('video/') ||
    VIDEO_EXTENSIONS.some((extension) => lowercaseName.endsWith(extension))
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function ClientBatchIntakeCard({ batch }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const uploadMutation = useSourceClipsUploadMutation(batch.id)

  // The board changes selected batches without remounting this component.
  const [previousBatchId, setPreviousBatchId] = useState(batch.id)
  if (batch.id !== previousBatchId) {
    setPreviousBatchId(batch.id)
    setFiles([])
    setSelectionError(null)
  }

  function addFiles(incoming: File[]) {
    if (uploadMutation.isPending) return
    uploadMutation.reset()
    const invalidType = incoming.find((file) => !isSupportedVideo(file))
    if (invalidType) {
      setSelectionError(
        `“${invalidType.name}” is not a supported video. Use MP4, MOV, WebM, or M4V.`,
      )
      return
    }
    const oversized = incoming.find((file) => file.size > MAX_FILE_BYTES)
    if (oversized) {
      setSelectionError(`“${oversized.name}” is larger than the 5 GB file limit.`)
      return
    }
    const existingKeys = new Set(files.map(fileKey))
    const uniqueIncoming = incoming.filter((file) => !existingKeys.has(fileKey(file)))
    if (files.length + uniqueIncoming.length > MAX_FILES) {
      setSelectionError(`A batch can contain up to ${MAX_FILES} clips.`)
      return
    }
    setFiles((current) => [...current, ...uniqueIncoming])
    setSelectionError(null)
  }

  const completeCount = uploadMutation.progress.filter(
    (item) => item.status === 'complete',
  ).length

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50/60 px-5 py-5 md:px-6 md:py-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-200">
            <UploadCloud className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-blue-600">
              Batch kickoff
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-[-0.02em] text-slate-950">
              Upload your clipped raw videos
            </h3>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-600">
              Add every clip you want edited in this batch. Each uploaded video becomes
              one separate item in your editor&apos;s workspace.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 md:p-6">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
          className="sr-only"
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />

        <button
          type="button"
          disabled={uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault()
            if (!uploadMutation.isPending) setDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDragging(false)
            }
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            addFiles(Array.from(event.dataTransfer.files))
          }}
          className={[
            'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60',
            dragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-blue-50/50',
          ].join(' ')}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
            <UploadCloud className="size-5" aria-hidden />
          </span>
          <span className="mt-3 text-sm font-semibold text-slate-900">
            Choose videos or drag them here
          </span>
          <span className="mt-1 text-[11px] text-slate-500">
            MP4, MOV, WebM or M4V · up to 5 GB per video
          </span>
        </button>

        {selectionError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {selectionError}
          </div>
        )}

        {files.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {files.length} {files.length === 1 ? 'clip' : 'clips'} selected
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {files.length} editor {files.length === 1 ? 'item' : 'items'} will be created
                </p>
              </div>
              {!uploadMutation.isPending && (
                <button
                  type="button"
                  onClick={() => {
                    setFiles([])
                    uploadMutation.reset()
                  }}
                  className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                >
                  Clear all
                </button>
              )}
            </div>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {files.map((file, index) => {
                const itemProgress = uploadMutation.progress[index]
                return (
                  <li key={fileKey(file)} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileVideo2 className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {index + 1}. {file.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {formatBytes(file.size)}
                          {itemProgress?.status === 'uploading'
                            ? ` · Uploading ${itemProgress.percent}%`
                            : itemProgress?.status === 'complete'
                              ? ' · Uploaded'
                              : ''}
                        </p>
                      </div>
                      {itemProgress?.status === 'complete' ? (
                        <span className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Check className="size-3.5" aria-hidden />
                        </span>
                      ) : itemProgress?.status === 'uploading' ? (
                        <LoaderCircle className="size-4 animate-spin text-blue-600" aria-hidden />
                      ) : (
                        <button
                          type="button"
                          disabled={uploadMutation.isPending}
                          onClick={() =>
                            {
                              setFiles((current) =>
                                current.filter((_, itemIndex) => itemIndex !== index),
                              )
                              uploadMutation.reset()
                            }
                          }
                          className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                    {itemProgress && itemProgress.status !== 'waiting' && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-[width]"
                          style={{ width: `${itemProgress.percent}%` }}
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {uploadMutation.isError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {apiErrorMessage(
              uploadMutation.error,
              'The upload could not be completed. Your batch has not been sent to the editor; please try again.',
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] leading-relaxed text-slate-500">
          <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
          Files upload directly to Scale Brands Lab&apos;s private storage.
        </div>

        <button
          type="button"
          disabled={files.length === 0 || uploadMutation.isPending}
          onClick={() => uploadMutation.mutate(files)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadMutation.isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              {completeCount < files.length
                ? `Uploading ${completeCount} of ${files.length}…`
                : 'Sending to your editor…'}
            </>
          ) : (
            <>
              <UploadCloud className="size-4" aria-hidden />
              {files.length === 0
                ? 'Choose clips to continue'
                : `Upload ${files.length} ${files.length === 1 ? 'clip' : 'clips'} and send to editor`}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
