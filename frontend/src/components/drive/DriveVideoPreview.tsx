import { ExternalLink } from 'lucide-react'
import { driveFileViewUrl, driveVideoPreviewUrl } from '@/lib/driveMedia'
import { qaPortraitIframeClass, qaPortraitPlayerBoxClass } from '@/lib/qaVideoPortrait'

export type DriveVideoLayout = 'landscape' | 'portrait'

type Props = {
  driveFileId: string
  fileName?: string
  className?: string
  /** Shorts / vertical — 9:16. Default is 16:9 landscape. */
  layout?: DriveVideoLayout
}

export function DriveVideoPreview({
  driveFileId,
  fileName,
  className,
  layout = 'landscape',
}: Props) {
  const previewUrl = driveVideoPreviewUrl(driveFileId)
  const viewUrl = driveFileViewUrl(driveFileId)

  const frameClass =
    layout === 'portrait'
      ? qaPortraitPlayerBoxClass
      : 'aspect-video w-full max-h-[min(52vh,560px)]'

  return (
    <div className={className}>
      <div
        className={
          layout === 'portrait'
            ? frameClass
            : `bg-muted/40 border-border overflow-hidden rounded-xl border ${frameClass}`
        }
        dir={layout === 'portrait' ? 'ltr' : undefined}
      >
        <iframe
          src={previewUrl}
          title={fileName ?? 'Video preview'}
          className={
            layout === 'portrait'
              ? qaPortraitIframeClass
              : 'h-full w-full border-0'
          }
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
      <a
        href={viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs font-medium"
      >
        Open in Google Drive
        <ExternalLink className="size-3" aria-hidden />
      </a>
    </div>
  )
}
