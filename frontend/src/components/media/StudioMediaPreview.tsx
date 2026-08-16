import { LoaderCircle } from 'lucide-react'
import { useMediaPlaybackQuery } from '@/hooks/api/media/useMediaPlaybackQuery'
import {
  qaPortraitIframeClass,
  qaPortraitPlayerBoxClass,
  qaPortraitVideoInnerClass,
} from '@/lib/qaVideoPortrait'

type Props = {
  assetId: string
  fileName: string
  kind: 'video' | 'thumbnail'
  layout?: 'portrait' | 'landscape'
  bare?: boolean
}

export function StudioMediaPreview({
  assetId,
  fileName,
  kind,
  layout = 'portrait',
  bare = false,
}: Props) {
  const playback = useMediaPlaybackQuery(assetId)
  const frameClass =
    layout === 'portrait'
      ? qaPortraitPlayerBoxClass
      : 'aspect-video w-full max-h-[min(52vh,560px)] overflow-hidden rounded-xl bg-black'

  if (playback.isPending) {
    return (
      <div className={`${bare ? 'size-full' : frameClass} flex items-center justify-center bg-slate-950 text-white`}>
        <LoaderCircle className="size-5 animate-spin" aria-label="Loading preview" />
      </div>
    )
  }
  if (!playback.data?.url) {
    return (
      <div className={`${bare ? 'size-full' : frameClass} flex items-center justify-center bg-slate-100 p-4`}>
        <p className="text-center text-xs text-slate-500">Preview unavailable. Try again shortly.</p>
      </div>
    )
  }
  if (kind === 'thumbnail') {
    if (bare) {
      return <img src={playback.data.url} alt={fileName} className={qaPortraitVideoInnerClass} />
    }
    return (
      <div className={frameClass} dir={layout === 'portrait' ? 'ltr' : undefined}>
        <img
          src={playback.data.url}
          alt={fileName}
          className={layout === 'portrait' ? qaPortraitVideoInnerClass : 'size-full object-contain'}
        />
      </div>
    )
  }
  if (bare) {
    return (
      <video
        src={playback.data.url}
        title={fileName}
        className={qaPortraitVideoInnerClass}
        controls
        playsInline
        preload="metadata"
      />
    )
  }
  return (
    <div className={frameClass} dir={layout === 'portrait' ? 'ltr' : undefined}>
      <video
        src={playback.data.url}
        title={fileName}
        className={layout === 'portrait' ? qaPortraitIframeClass : 'size-full bg-black object-contain'}
        controls
        playsInline
        preload="metadata"
      />
    </div>
  )
}
