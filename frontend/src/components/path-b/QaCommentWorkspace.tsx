import { useState } from 'react'
import type { QaComment } from '@mockData/index'
import { DeliverableVideoThumbnailTitleBlock } from '@/components/drive/DeliverableVideoThumbnailTitleBlock'
import { DriveVideoPreview } from '@/components/drive/DriveVideoPreview'
import { QaCommentWorkspaceThread } from '@/components/path-b/QaCommentWorkspaceThread'
import { SAMPLE_VIDEO_SRC } from '@mockData/index'
import { useTheme } from '@/theme'

export type QaCommentWorkspaceRole = 'smm' | 'client'

type Props = {
  role: QaCommentWorkspaceRole
  videoTitle: string
  deliverableIndex?: number
  comments: QaComment[]
  videoDriveFileId?: string
  videoFileName?: string
  fallbackVideoSrc?: string
  /** Client unified QA — show thumbnail + title under the player */
  showPackagePreview?: boolean
  thumbnailDriveFileId?: string
  thumbnailFileName?: string
  displayVideoTitle?: string
  commentPlaceholder?: string
  onAddComment?: (body: string) => void
  onApprove?: () => void
  onRequestChanges?: (commentBody: string) => void
  approveLabel?: string
  requestChangesLabel?: string
  addCommentDisabled?: boolean
  actionsDisabled?: boolean
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
  showPackagePreview = false,
  thumbnailDriveFileId,
  thumbnailFileName,
  displayVideoTitle,
  commentPlaceholder = 'Add a comment (plain text; you may type @1:03)',
  onAddComment,
  onApprove,
  onRequestChanges,
  approveLabel,
  requestChangesLabel,
  addCommentDisabled = false,
  actionsDisabled = false,
  className = '',
}: Props) {
  const { theme } = useTheme()
  const [draft, setDraft] = useState('')

  const resolvedApprove =
    approveLabel ?? (role === 'smm' ? 'Approve & release to client' : 'Approve')
  const resolvedReject =
    requestChangesLabel ?? (role === 'client' ? 'Request changes' : 'Send back to editor')

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

  return (
    <div className={`flex min-h-0 flex-col gap-5 ${className}`.trim()}>
      <p className="text-foreground sr-only">{heading}</p>

      <div className="min-w-0 shrink-0">
        {showPackagePreview ? (
          <DeliverableVideoThumbnailTitleBlock
            theme={theme}
            videoDriveFileId={videoDriveFileId}
            fallbackVideoSrc={videoDriveFileId ? undefined : fallbackVideoSrc}
            videoFileName={videoFileName}
            thumbnailDriveFileId={thumbnailDriveFileId}
            thumbnailFileName={thumbnailFileName}
            displayVideoTitle={displayVideoTitle ?? videoTitle}
          />
        ) : videoDriveFileId ? (
          <DriveVideoPreview
            driveFileId={videoDriveFileId}
            fileName={videoFileName}
            layout="portrait"
          />
        ) : (
          <div className="border-border bg-muted/20 overflow-hidden rounded-xl border">
            <video
              className="aspect-[9/16] max-h-[min(52vh,560px)] w-full bg-black object-contain"
              controls
              playsInline
              preload="metadata"
              src={fallbackVideoSrc}
            />
          </div>
        )}
      </div>

      <section className="min-h-0 flex-1 space-y-3">
        <p className="text-foreground text-xs font-semibold uppercase tracking-wide">
          Comment thread
        </p>
        <div className="max-h-[min(36vh,320px)] overflow-y-auto overscroll-y-contain pr-1">
          <QaCommentWorkspaceThread comments={comments} />
        </div>
      </section>

      {onAddComment ? (
        <div className="space-y-2">
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

      {(onApprove || onRequestChanges) && (
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
      )}
    </div>
  )
}
