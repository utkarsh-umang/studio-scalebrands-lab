import { ExternalLink } from 'lucide-react'
import { driveFileViewUrl, driveVideoPreviewUrl } from '@/lib/driveMedia'

type Props = {
  driveFileId: string
  fileName?: string
  className?: string
}

export function DriveVideoPreview({ driveFileId, fileName, className }: Props) {
  const previewUrl = driveVideoPreviewUrl(driveFileId)
  const viewUrl = driveFileViewUrl(driveFileId)

  return (
    <div className={className}>
      <div
        className="bg-muted/40 border-border aspect-video w-full overflow-hidden rounded-xl border"
        style={{ minHeight: 240 }}
      >
        <iframe
          src={previewUrl}
          title={fileName ?? 'Video preview'}
          className="h-full min-h-[min(42vh,420px)] w-full border-0"
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
