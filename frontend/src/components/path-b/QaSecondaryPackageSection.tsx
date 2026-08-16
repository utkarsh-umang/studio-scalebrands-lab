import { ExternalLink, ImageIcon } from 'lucide-react'
import {
  driveFileViewUrl,
  driveStreamUrl,
} from '@/lib/driveMedia'
import {
  qaPortraitChromeClass,
  qaPortraitPlayerBoxClass,
  qaPortraitVideoInnerClass,
} from '@/lib/qaVideoPortrait'
import type { AppTheme } from '@/theme/types'
import { StudioMediaPreview } from '@/components/media/StudioMediaPreview'

const THUMB_MISSING_COPY =
  'Thumbnail not uploaded yet — it will appear here once it is stored in Studio.'

type Props = {
  theme: AppTheme
  thumbnailDriveFileId?: string
  thumbnailAssetId?: string
  thumbnailFileName?: string
  displayVideoTitle?: string
  helperCopy?: string
  className?: string
}

export function QaSecondaryPackageSection({
  theme,
  thumbnailDriveFileId,
  thumbnailAssetId,
  thumbnailFileName,
  displayVideoTitle,
  helperCopy = 'Questions about the thumbnail or title? Mention them in your comments above — main video feedback stays in the thread next to the player.',
  className = '',
}: Props) {
  const primary = theme.colors.primary
  const thumbViewUrl = thumbnailDriveFileId
    ? driveFileViewUrl(thumbnailDriveFileId)
    : undefined
  const thumbSrc = thumbnailDriveFileId
    ? driveStreamUrl(thumbnailDriveFileId)
    : undefined
  const titleText = displayVideoTitle?.trim()

  return (
    <section
      className={[
        'border-border bg-muted/10 space-y-3 rounded-xl border px-4 py-4',
        className,
      ].join(' ')}
    >
      <p className="text-muted-foreground text-xs leading-relaxed">{helperCopy}</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <div>
          <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
            Thumbnail
          </p>
          <div
            className={qaPortraitChromeClass}
            style={{ boxShadow: `0 12px 40px -12px ${primary}18` }}
          >
            <div className="flex w-full flex-col items-center">
              <div className={qaPortraitPlayerBoxClass} dir="ltr">
                {thumbnailAssetId ? (
                  <StudioMediaPreview
                    assetId={thumbnailAssetId}
                    fileName={thumbnailFileName ?? 'Thumbnail preview'}
                    kind="thumbnail"
                    layout="portrait"
                    bare
                  />
                ) : thumbnailDriveFileId && thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt={thumbnailFileName ?? 'Thumbnail preview'}
                    className={qaPortraitVideoInnerClass}
                  />
                ) : (
                  <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-xs leading-relaxed">
                    <ImageIcon className="size-7 opacity-70" aria-hidden />
                    <p>{THUMB_MISSING_COPY}</p>
                  </div>
                )}
              </div>
              {thumbViewUrl ? (
                <a
                  href={thumbViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs font-medium"
                >
                  Open in Drive
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
            Video title
          </p>
          <div className="border-border bg-background flex min-h-[120px] items-center rounded-xl border px-4 py-3">
            {titleText ? (
              <p className="text-foreground text-sm font-medium leading-snug">{titleText}</p>
            ) : (
              <p className="text-muted-foreground text-sm">Title not set yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
