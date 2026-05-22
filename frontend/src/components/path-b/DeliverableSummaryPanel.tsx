import { useState, type ReactNode } from 'react'
import { ExternalLink, ImageIcon, Play } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DriveVideoPreview } from '@/components/drive/DriveVideoPreview'
import { DriveSyncButton } from '@/components/path-b/DriveSyncButton'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import {
  driveFileViewUrl,
  driveThumbnailUrl,
  getMediaEntry,
} from '@/lib/driveMedia'

type RowKey = 'raw' | 'clip' | 'video' | 'thumbnail' | 'title'

type Props = {
  batch: AdminBatchFolder
  deliverableIndex: number
  ticket?: AdminVideoTicket
  manifest?: BatchDriveManifest
  /** SMM or editor can edit title */
  titleEditable?: boolean
  onSaveTitle?: (title: string) => void
  onSyncDrive?: () => void
  driveSyncing?: boolean
  className?: string
}

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="border-border grid gap-2 border-b py-3 last:border-b-0 sm:grid-cols-[140px_1fr] sm:items-start sm:gap-4">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function DeliverableSummaryPanel({
  batch,
  deliverableIndex,
  ticket,
  manifest,
  titleEditable = false,
  onSaveTitle,
  onSyncDrive,
  driveSyncing = false,
  className = '',
}: Props) {
  const [expandedPreview, setExpandedPreview] = useState<RowKey | null>(null)
  const [titleDraft, setTitleDraft] = useState(ticket?.editorPublishTitle ?? '')

  const clipEntry = getMediaEntry(batch.id, 'clips', deliverableIndex)
  const videoEntry = manifest
    ? manifest.videos.find((v) => v.index === deliverableIndex)
    : getMediaEntry(batch.id, 'videos', deliverableIndex)
  const thumbEntry = manifest
    ? manifest.thumbnails.find((t) => t.index === deliverableIndex)
    : getMediaEntry(batch.id, 'thumbnails', deliverableIndex)

  const rawUrl = batch.sourceMediaUrl?.trim() || batch.footageUrl?.trim()

  function togglePreview(key: RowKey) {
    setExpandedPreview((prev) => (prev === key ? null : key))
  }

  return (
    <div
      className={[
        'border-border bg-muted/10 divide-border divide-y rounded-xl border',
        className,
      ].join(' ')}
    >
      <div className="px-4">
        <SummaryRow label="Raw footage">
          {rawUrl ? (
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline"
            >
              Open source
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
          ) : (
            <p className="text-muted-foreground text-sm">No source link on this batch.</p>
          )}
        </SummaryRow>

        <SummaryRow label={`Clip #${deliverableIndex}`}>
          {clipEntry ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    togglePreview('clip')
                  }}
                  className="border-border bg-background hover:bg-muted/40 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                >
                  <Play className="size-3.5" aria-hidden />
                  {expandedPreview === 'clip' ? 'Hide preview' : 'Preview clip'}
                </button>
                {batch.clipsFolderUrl ? (
                  <a
                    href={batch.clipsFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
                  >
                    Clips folder
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{clipEntry.name}</p>
              {expandedPreview === 'clip' ? (
                <DriveVideoPreview
                  driveFileId={clipEntry.driveFileId}
                  fileName={clipEntry.name}
                  layout="portrait"
                />
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No clip file for this index.</p>
          )}
        </SummaryRow>

        <SummaryRow label={`Completed video #${deliverableIndex}`}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {videoEntry ? (
                <button
                  type="button"
                  onClick={() => {
                    togglePreview('video')
                  }}
                  className="border-border bg-background hover:bg-muted/40 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                >
                  <Play className="size-3.5" aria-hidden />
                  {expandedPreview === 'video' ? 'Hide preview' : 'Preview video'}
                </button>
              ) : (
                <span className="text-muted-foreground text-sm">Not on Drive yet.</span>
              )}
              {onSyncDrive ? (
                <DriveSyncButton onSync={onSyncDrive} syncing={driveSyncing} label="Sync" />
              ) : null}
            </div>
            {videoEntry && expandedPreview === 'video' ? (
              <DriveVideoPreview
                driveFileId={videoEntry.driveFileId}
                fileName={videoEntry.name}
                layout="portrait"
              />
            ) : null}
          </div>
        </SummaryRow>

        <SummaryRow label={`Thumbnail #${deliverableIndex}`}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {thumbEntry ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      togglePreview('thumbnail')
                    }}
                    className="border-border bg-background hover:bg-muted/40 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                  >
                    <ImageIcon className="size-3.5" aria-hidden />
                    {expandedPreview === 'thumbnail' ? 'Hide preview' : 'Preview thumbnail'}
                  </button>
                  <a
                    href={driveFileViewUrl(thumbEntry.driveFileId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
                  >
                    Open in Drive
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                </>
              ) : (
                <span className="text-muted-foreground text-sm">Not on Drive yet.</span>
              )}
              {onSyncDrive ? (
                <DriveSyncButton onSync={onSyncDrive} syncing={driveSyncing} label="Sync" />
              ) : null}
            </div>
            {thumbEntry && expandedPreview === 'thumbnail' ? (
              <img
                src={driveThumbnailUrl(thumbEntry.driveFileId)}
                alt={thumbEntry.name}
                className="max-h-[min(40vh,360px)] w-auto max-w-full rounded-lg border object-contain"
              />
            ) : null}
          </div>
        </SummaryRow>

        <SummaryRow label="Video title">
          {titleEditable && onSaveTitle ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => {
                  setTitleDraft(e.target.value)
                }}
                placeholder="Publish title (stored in Studio)"
                className="border-border bg-background text-foreground min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
              <button
                type="button"
                onClick={() => {
                  onSaveTitle(titleDraft.trim())
                }}
                disabled={!titleDraft.trim()}
                className="border-border hover:bg-muted/40 shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-foreground text-sm font-medium">
              {ticket?.editorPublishTitle?.trim() || (
                <span className="text-muted-foreground font-normal">Not set</span>
              )}
            </p>
          )}
        </SummaryRow>
      </div>
    </div>
  )
}
