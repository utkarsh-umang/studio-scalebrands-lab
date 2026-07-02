import { useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { DriveVideoPreview } from '@/components/drive/DriveVideoPreview'
import { DeliverableAccordion, type DeliverableAccordionStatus } from '@/components/path-b/DeliverableAccordion'
import { DriveAccessNotice } from '@/components/path-b/DriveAccessNotice'
import type { DriveDiagnosticsDto } from '@/client'
import {
  deliverablePortraitPlayerBoxClass,
  qaPortraitChromeClass,
  qaPortraitVideoInnerClass,
} from '@/lib/qaVideoPortrait'
import { DriveSyncButton } from '@/components/path-b/DriveSyncButton'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import {
  driveFileViewUrl,
  driveStreamUrl,
  getMediaEntry,
} from '@/lib/driveMedia'
import type { DeliverableReadiness } from '@/lib/pathBDeliverables'

export type DeliverableSummarySection =
  | 'raw'
  | 'clip'
  | 'video'
  | 'thumbnail'
  | 'title'

type Props = {
  batch: AdminBatchFolder
  deliverableIndex: number
  ticket?: AdminVideoTicket
  manifest?: BatchDriveManifest & { diagnostics?: DriveDiagnosticsDto | null }
  titleEditable?: boolean
  onSaveTitle?: (title: string) => void
  onSyncDrive?: () => void
  driveSyncing?: boolean
  /** Show Ready / Missing chips on video, thumbnail, title (and clip when readiness passed). */
  readiness?: DeliverableReadiness
  defaultOpenSections?: DeliverableSummarySection[]
  /** Auto-expand video / thumb / title sections that are not ready. */
  autoExpandMissing?: boolean
  className?: string
}

function buildInitialOpen(
  defaultOpen: DeliverableSummarySection[],
  autoExpandMissing: boolean,
  readiness?: DeliverableReadiness,
): Set<DeliverableSummarySection> {
  const next = new Set(defaultOpen)
  if (autoExpandMissing && readiness) {
    if (!readiness.videoReady) next.add('video')
    if (!readiness.thumbnailReady) next.add('thumbnail')
    if (!readiness.titleReady) next.add('title')
  }
  return next
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
  readiness,
  defaultOpenSections = [],
  autoExpandMissing = false,
  className = '',
}: Props) {
  const [openSections, setOpenSections] = useState(() =>
    buildInitialOpen(defaultOpenSections, autoExpandMissing, readiness),
  )
  const [titleDraft, setTitleDraft] = useState(ticket?.editorPublishTitle ?? '')

  useEffect(() => {
    setTitleDraft(ticket?.editorPublishTitle ?? '')
  }, [ticket?.editorPublishTitle, ticket?.id])

  useEffect(() => {
    setOpenSections(
      buildInitialOpen(defaultOpenSections, autoExpandMissing, readiness),
    )
  }, [
    batch.id,
    deliverableIndex,
    autoExpandMissing,
    readiness?.videoReady,
    readiness?.thumbnailReady,
    readiness?.titleReady,
    defaultOpenSections.join(','),
  ])

  const clipEntry = manifest
    ? manifest.clips.find((c) => c.index === deliverableIndex)
    : getMediaEntry(batch.id, 'clips', deliverableIndex)
  const videoEntry = manifest
    ? manifest.videos.find((v) => v.index === deliverableIndex)
    : getMediaEntry(batch.id, 'videos', deliverableIndex)
  const thumbEntry = manifest
    ? manifest.thumbnails.find((t) => t.index === deliverableIndex)
    : getMediaEntry(batch.id, 'thumbnails', deliverableIndex)

  const rawUrl = batch.sourceMediaUrl?.trim() || batch.footageUrl?.trim()

  const videoReady = readiness?.videoReady ?? Boolean(videoEntry)
  const thumbnailReady = readiness?.thumbnailReady ?? Boolean(thumbEntry)
  const titleReady =
    readiness?.titleReady ?? Boolean(ticket?.editorPublishTitle?.trim())

  const sectionStatus = useMemo(
    (): Record<DeliverableSummarySection, DeliverableAccordionStatus | undefined> => ({
      raw: rawUrl ? 'info' : 'missing',
      clip: clipEntry ? 'ready' : 'missing',
      video: videoReady ? 'ready' : 'missing',
      thumbnail: thumbnailReady ? 'ready' : 'missing',
      title: titleReady ? 'ready' : 'missing',
    }),
    [rawUrl, clipEntry, videoReady, thumbnailReady, titleReady],
  )

  function setSectionOpen(section: DeliverableSummarySection, open: boolean) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (open) next.add(section)
      else next.delete(section)
      return next
    })
  }

  function syncAside() {
    if (!onSyncDrive) return null
    return <DriveSyncButton onSync={onSyncDrive} syncing={driveSyncing} label="Sync" />
  }

  const ownerSuffix = (kind?: 'smm' | 'editor' | null) =>
    kind === 'smm' ? ' · SMM' : kind === 'editor' ? ' · Editor' : ''

  return (
    <div
      className={[
        'border-border bg-muted/10 overflow-hidden rounded-xl border',
        className,
      ].join(' ')}
    >
      <DriveAccessNotice
        diagnostics={manifest?.diagnostics}
        slot="deliverables"
        unmapped={manifest?.unmapped}
        problemsOnly
        className="m-3"
      />
      <DeliverableAccordion
        id={`deliverable-${deliverableIndex}-raw`}
        title="Raw footage"
        status={sectionStatus.raw}
        statusLabel={rawUrl ? 'Linked' : undefined}
        open={openSections.has('raw')}
        onOpenChange={(open) => {
          setSectionOpen('raw', open)
        }}
      >
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
      </DeliverableAccordion>

      <DeliverableAccordion
        id={`deliverable-${deliverableIndex}-clip`}
        title={`Clip #${deliverableIndex}`}
        status={sectionStatus.clip}
        open={openSections.has('clip')}
        onOpenChange={(open) => {
          setSectionOpen('clip', open)
        }}
      >
        {clipEntry ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs">{clipEntry.name}</p>
            <DriveVideoPreview
              driveFileId={clipEntry.driveFileId}
              fileName={clipEntry.name}
              layout="portrait"
            />
            {batch.clipsFolderUrl ? (
              <a
                href={batch.clipsFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                Open clips folder
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No clip file for this index.</p>
        )}
      </DeliverableAccordion>

      <DeliverableAccordion
        id={`deliverable-${deliverableIndex}-video`}
        title={`Completed video #${deliverableIndex}`}
        status={sectionStatus.video}
        open={openSections.has('video')}
        onOpenChange={(open) => {
          setSectionOpen('video', open)
        }}
        headerAside={syncAside()}
      >
        {videoEntry ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs">{videoEntry.name}</p>
            <DriveVideoPreview
              driveFileId={videoEntry.driveFileId}
              fileName={videoEntry.name}
              layout="portrait"
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Upload <span className="text-foreground font-medium">videos/{deliverableIndex}</span>{' '}
            in the deliverables folder, then sync.
          </p>
        )}
      </DeliverableAccordion>

      <DeliverableAccordion
        id={`deliverable-${deliverableIndex}-thumbnail`}
        title={`Thumbnail #${deliverableIndex}${ownerSuffix(batch.thumbnailOwnerKind)}`}
        status={sectionStatus.thumbnail}
        open={openSections.has('thumbnail')}
        onOpenChange={(open) => {
          setSectionOpen('thumbnail', open)
        }}
        headerAside={syncAside()}
      >
        {thumbEntry ? (
          <div className="space-y-3">
            <div className={qaPortraitChromeClass}>
              <div className="flex w-full flex-col items-center">
                <div className={deliverablePortraitPlayerBoxClass} dir="ltr">
                  <img
                    src={driveStreamUrl(thumbEntry.driveFileId)}
                    alt={thumbEntry.name}
                    className={qaPortraitVideoInnerClass}
                  />
                </div>
              </div>
            </div>
            <a
              href={driveFileViewUrl(thumbEntry.driveFileId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
            >
              Open in Drive
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Upload <span className="text-foreground font-medium">thumbnails/{deliverableIndex}</span>{' '}
            in the deliverables folder, then sync.
          </p>
        )}
      </DeliverableAccordion>

      <DeliverableAccordion
        id={`deliverable-${deliverableIndex}-title`}
        title={`Video title${ownerSuffix(batch.titleOwnerKind)}`}
        status={sectionStatus.title}
        open={openSections.has('title')}
        onOpenChange={(open) => {
          setSectionOpen('title', open)
        }}
      >
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
              <span className="text-muted-foreground font-normal">Not set — add a title in Studio.</span>
            )}
          </p>
        )}
      </DeliverableAccordion>
    </div>
  )
}
