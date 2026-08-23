import { FileImage, Film, LoaderCircle } from 'lucide-react'
import { useMediaPlaybackQuery } from '@/hooks/api/media/useMediaPlaybackQuery'

type Props = {
  assetId: string
  fileName: string
  contentType: string
  compact?: boolean
}

export function QaReviewAttachment({
  assetId,
  fileName,
  contentType,
  compact = false,
}: Props) {
  const playback = useMediaPlaybackQuery(assetId)
  const isVideo = contentType.startsWith('video/')

  if (playback.isPending) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <LoaderCircle className="size-4 animate-spin" aria-label={`Loading ${fileName}`} />
      </div>
    )
  }

  if (!playback.data?.url) {
    return (
      <div className="flex h-24 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-xs text-slate-500">
        {isVideo ? <Film className="size-4" aria-hidden /> : <FileImage className="size-4" aria-hidden />}
        Preview unavailable
      </div>
    )
  }

  return (
    <a
      href={playback.data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-950"
      title={`Open ${fileName}`}
    >
      {isVideo ? (
        <video
          src={playback.data.url}
          className={compact ? 'h-28 w-full object-cover' : 'max-h-56 w-full object-contain'}
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          src={playback.data.url}
          alt={fileName}
          className={compact ? 'h-28 w-full object-cover' : 'max-h-56 w-full object-contain'}
        />
      )}
      <span className="block truncate bg-white px-2.5 py-2 text-[10px] font-medium text-slate-600 group-hover:text-slate-950">
        {fileName}
      </span>
    </a>
  )
}
