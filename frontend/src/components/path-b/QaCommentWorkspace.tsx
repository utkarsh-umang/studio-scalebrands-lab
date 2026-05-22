import { useState, type ReactNode } from 'react'
import type { QaComment } from '@mockData/index'
import { DriveVideoPreview } from '@/components/drive/DriveVideoPreview'
import { QaCommentWorkspaceThread } from '@/components/path-b/QaCommentWorkspaceThread'
import { QaSecondaryPackageSection } from '@/components/path-b/QaSecondaryPackageSection'
import { SAMPLE_VIDEO_SRC } from '@mockData/index'
import {
  qaPortraitChromeClass,
  qaPortraitPlayerBoxClass,
  qaPortraitVideoInnerClass,
} from '@/lib/qaVideoPortrait'
import { useTheme } from '@/theme'

export type QaCommentWorkspaceRole = 'smm' | 'client' | 'editor'

type Props = {
  role: QaCommentWorkspaceRole
  videoTitle: string
  deliverableIndex?: number
  comments: QaComment[]
  videoDriveFileId?: string
  videoFileName?: string
  fallbackVideoSrc?: string
  /** @deprecated Use thumbnail/title props; video always shows in the left column. */
  showPackagePreview?: boolean
  thumbnailDriveFileId?: string
  thumbnailFileName?: string
  displayVideoTitle?: string
  secondaryPackageHelper?: string
  commentPlaceholder?: string
  onAddComment?: (body: string) => void
  onApprove?: () => void
  onRequestChanges?: (commentBody: string) => void
  approveLabel?: string
  requestChangesLabel?: string
  addCommentDisabled?: boolean
  actionsDisabled?: boolean
  /** Editor resubmit or other role-specific footer (replaces approve/reject). */
  customFooter?: ReactNode
  className?: string
}

export function QaCommentWorkspace({
  role,
  videoTitle,
  deliverableIndex,
  comments,
  videoDriveFileId,
  videoFileName,
  fallbackVideoSrc = SAMPLE_VIDEO_SRC,
  showPackagePreview: _legacyPackagePreview,
  thumbnailDriveFileId,
  thumbnailFileName,
  displayVideoTitle,
  secondaryPackageHelper,
  commentPlaceholder = 'Add a comment (plain text; you may type @1:03)',
  onAddComment,
  onApprove,
  onRequestChanges,
  approveLabel,
  requestChangesLabel,
  addCommentDisabled = false,
  actionsDisabled = false,
  customFooter,
  className = '',
}: Props) {
  const { theme } = useTheme()
  const [draft, setDraft] = useState('')
  const primary = theme.colors.primary

  const resolvedApprove =
    approveLabel ?? (role === 'smm' ? 'Approve & release to client' : 'Approve')
  const resolvedReject =
    requestChangesLabel ??
    (role === 'client' ? 'Request changes' : 'Send back to editor')

  const showSecondaryPackage =
    Boolean(thumbnailDriveFileId || thumbnailFileName || displayVideoTitle?.trim()) ||
    _legacyPackagePreview === true

  function submitComment() {
    const body = draft.trim()
    if (!body || !onAddComment) return
    onAddComment(body)
    setDraft('')
  }

  const heading =
    deliverableIndex != null
      ? `QA — ${videoTitle} · #${deliverableIndex}`
      : `QA — ${videoTitle}`

  const videoPlayer = videoDriveFileId ? (
    <DriveVideoPreview
      driveFileId={videoDriveFileId}
      fileName={videoFileName}
      layout="portrait"
    />
  ) : (
    <div className="flex flex-col items-center">
      <div className={qaPortraitPlayerBoxClass} dir="ltr">
        <video
          className={qaPortraitVideoInnerClass}
          controls
          playsInline
          preload="metadata"
          src={fallbackVideoSrc}
        />
      </div>
    </div>
  )

  const defaultFooter = (onApprove || onRequestChanges) && !customFooter && (
    <footer className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
      {onRequestChanges ? (
        <button
          type="button"
          onClick={() => {
            const body = draft.trim()
            if (!body) return
            onRequestChanges(body)
          }}
          disabled={actionsDisabled || !draft.trim()}
          className="border-border text-destructive hover:bg-destructive/5 inline-flex justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {resolvedReject}
        </button>
      ) : null}
      {onApprove ? (
        <button
          type="button"
          onClick={onApprove}
          disabled={actionsDisabled}
          className="inline-flex justify-center rounded-xl bg-[var(--success)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {resolvedApprove}
        </button>
      ) : null}
    </footer>
  )

  return (
    <div className={`flex min-h-0 flex-col gap-4 ${className}`.trim()}>
      <p className="text-foreground sr-only">{heading}</p>

      <div className="flex min-h-0 flex-col gap-4 md:min-h-[min(52vh,480px)] md:flex-row md:gap-5">
        <div className="flex min-h-0 shrink-0 flex-col md:w-[58%] md:max-w-[58%]">
          <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
            Video
          </p>
          <div
            className={qaPortraitChromeClass}
            style={{ boxShadow: `0 12px 40px -12px ${primary}22` }}
          >
            {videoPlayer}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 md:max-h-[min(52vh,480px)]">
          <p className="text-foreground shrink-0 text-xs font-semibold uppercase tracking-wide">
            Comment thread
          </p>
          <div className="min-h-[min(28vh,240px)] flex-1 overflow-y-auto overscroll-y-contain pr-1 md:min-h-0">
            <QaCommentWorkspaceThread comments={comments} />
          </div>

          {onAddComment ? (
            <div className="shrink-0 space-y-2">
              <label
                htmlFor="qa-workspace-comment"
                className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide"
              >
                Add comment
              </label>
              <textarea
                id="qa-workspace-comment"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                }}
                rows={3}
                disabled={addCommentDisabled}
                placeholder={commentPlaceholder}
                className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={addCommentDisabled || !draft.trim()}
                className="border-border hover:bg-muted/40 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Post comment
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {showSecondaryPackage ? (
        <QaSecondaryPackageSection
          theme={theme}
          thumbnailDriveFileId={thumbnailDriveFileId}
          thumbnailFileName={thumbnailFileName}
          displayVideoTitle={displayVideoTitle ?? videoTitle}
          helperCopy={secondaryPackageHelper}
        />
      ) : null}

      {customFooter ?? defaultFooter}
    </div>
  )
}
