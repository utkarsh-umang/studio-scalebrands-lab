import { ExternalLink, ImageIcon } from 'lucide-react'
import type { Ref } from 'react'
import {
  DriveVideoPreview,
  type DriveVideoLayout,
} from '@/components/drive/DriveVideoPreview'
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

const THUMB_MISSING_COPY =
  "The editor hasn't added the thumbnail yet. It will show here once they've uploaded it to this batch's Thumbnail folder on Drive."

export type DeliverableVideoThumbnailTitleBlockProps = {
  theme: AppTheme
  videoLayout?: DriveVideoLayout
  /** portrait QA uses Drive preview iframe when set */
  videoDriveFileId?: string
  fallbackVideoSrc?: string
  /** Attached when using a streamed/fallback portrait video element. */
  nativeVideoRef?: Ref<HTMLVideoElement>
  videoFileName?: string
  thumbnailDriveFileId?: string
  thumbnailFileName?: string
  /** Working / delivery title from Studio (not the publish title from the editor handoff step). */
  displayVideoTitle?: string
}

export function DeliverableVideoThumbnailTitleBlock({
  theme,
  videoLayout = 'portrait',
  videoDriveFileId,
  fallbackVideoSrc,
  nativeVideoRef,
  videoFileName,
  thumbnailDriveFileId,
  thumbnailFileName,
  displayVideoTitle,
}: DeliverableVideoThumbnailTitleBlockProps) {
  const primary = theme.colors.primary
  const thumbViewUrl = thumbnailDriveFileId
    ? driveFileViewUrl(thumbnailDriveFileId)
    : undefined
  const thumbSrc = thumbnailDriveFileId
    ? driveStreamUrl(thumbnailDriveFileId)
    : undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <div className={qaPortraitChromeClass} style={{ boxShadow: `0 12px 40px -12px ${primary}22` }}>
          {videoDriveFileId ? (
            <DriveVideoPreview
              driveFileId={videoDriveFileId}
              fileName={videoFileName}
              layout={videoLayout}
            />
          ) : fallbackVideoSrc ? (
            videoLayout === 'portrait' ? (
              <div className="flex flex-col items-center">
                <div className={qaPortraitPlayerBoxClass} dir="ltr">
                  <video
                    ref={nativeVideoRef}
                    className={qaPortraitVideoInnerClass}
                    controls
                    playsInline
                    preload="metadata"
                    src={fallbackVideoSrc}
                  />
                </div>
              </div>
            ) : (
              <video
                className="aspect-video w-full max-h-[min(52vh,560px)] rounded-lg bg-black object-contain"
                controls
                playsInline
                preload="metadata"
                src={fallbackVideoSrc}
              />
            )
          ) : (
            <p className="text-muted-foreground p-6 text-center text-sm">
              No video source configured.
            </p>
          )}
        </div>

        <div className={qaPortraitChromeClass} style={{ boxShadow: `0 12px 40px -12px ${primary}18` }}>
          <div className="flex w-full flex-col items-center">
            <div
              className={`${qaPortraitPlayerBoxClass} flex items-center justify-center bg-black/80`}
              dir="ltr"
            >
              {thumbnailDriveFileId && thumbSrc ? (
                <img
                  src={thumbSrc}
                  alt={thumbnailFileName ?? 'Thumbnail preview'}
                  className={qaPortraitVideoInnerClass}
                />
              ) : (
                <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm leading-relaxed">
                  <ImageIcon className="size-8 opacity-70" aria-hidden />
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
                Open thumbnail in Drive
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {displayVideoTitle?.trim() ? (
        <div className="border-border bg-muted/15 rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
            Video title
          </p>
          <p className="text-foreground mt-1 text-sm font-medium leading-snug">
            {displayVideoTitle.trim()}
          </p>
        </div>
      ) : null}
    </div>
  )
}
