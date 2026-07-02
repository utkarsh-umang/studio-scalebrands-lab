import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  driveFileViewUrl,
  driveStreamUrl,
  driveThumbnailUrl,
} from '@/lib/driveMedia'

type Props = {
  driveFileId: string
  fileName?: string
}

export function DriveThumbnailPreview({ driveFileId, fileName }: Props) {
  // Stream via the backend proxy first; fall back to the Google thumbnail URL.
  const [streamFailed, setStreamFailed] = useState(false)
  const imgUrl = streamFailed
    ? driveThumbnailUrl(driveFileId)
    : driveStreamUrl(driveFileId)
  const viewUrl = driveFileViewUrl(driveFileId)

  return (
    <div>
      <div className="bg-muted/40 border-border flex max-h-[min(50vh,480px)] items-center justify-center overflow-hidden rounded-xl border p-2">
        <img
          src={imgUrl}
          alt={fileName ?? 'Thumbnail preview'}
          className="max-h-[min(48vh,460px)] w-auto max-w-full object-contain"
          onError={() => {
            if (!streamFailed) setStreamFailed(true)
          }}
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
