import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { SAMPLE_VIDEO_SRC } from '@mockData/index'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DeliverableVideoThumbnailTitleBlock } from '@/components/drive/DeliverableVideoThumbnailTitleBlock'
import { StudioModalShell } from '@/components/StudioModalShell'
import { ClientClipReviewPanel } from '@/components/client/ClientClipReviewPanel'
import { EditorQaFixPanel } from '@/components/editor/EditorQaFixPanel'
import {
  batchAwaitingClips,
  batchReadyForEditorWork,
  videoEditorQaReturn,
  videoNeedsEditorThumbnailsSubmit,
  videoNeedsEditorTitleSubmit,
} from '@/lib/editorBoard'
import {
  batchThumbnailsCompleteInManifest,
  deliverableIndexForTicket,
  formatSyncedAt,
  getManifestForBatch,
  getMediaEntry,
  reloadDriveManifestForBatch,
} from '@/lib/driveMedia'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  open: boolean
  onClose: () => void
}

function sortedBatchTickets(tickets: AdminVideoTicket[]): AdminVideoTicket[] {
  return [...tickets].sort(
    (a, b) =>
      (a.deliverableIndex ?? deliverableIndexForTicket(a)) -
      (b.deliverableIndex ?? deliverableIndexForTicket(b)),
  )
}

function videoCountForBatch(batch: AdminBatchFolder, tickets: AdminVideoTicket[]): number {
  if (batch.videoCount > 0) return batch.videoCount
  if (tickets.length === 0) return 0
  return Math.max(...tickets.map((t) => t.deliverableIndex ?? deliverableIndexForTicket(t)))
}

export function EditorBatchWorkspaceModal({ batch, clientName, open, onClose }: Props) {
  const { theme } = useTheme()
  const {
    getVideosForBatch,
    submitEditorVideosDrive,
    submitEditorThumbnailsForReview,
    submitEditorVideoTitle,
  } = useAdminWorkspace()

  const batchTickets = useMemo(
    () => sortedBatchTickets(getVideosForBatch(batch.id)),
    [getVideosForBatch, batch.id],
  )

  const [driveUrl, setDriveUrl] = useState(batch.editorDeliverablesDriveUrl ?? '')
  const [manifestSnap, setManifestSnap] = useState<ReturnType<typeof getManifestForBatch>>(
    undefined,
  )
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [thumbPick, setThumbPick] = useState(1)
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    setDriveUrl(batch.editorDeliverablesDriveUrl ?? '')
  }, [batch.id, batch.editorDeliverablesDriveUrl])

  useEffect(() => {
    setManifestSnap(undefined)
  }, [batch.id])

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const t of batchTickets) {
      next[t.id] = t.editorPublishTitle ?? ''
    }
    setTitleDrafts(next)
  }, [batch.id, batchTickets])

  const manifest = manifestSnap ?? getManifestForBatch(batch.id)

  const qaFixTickets = batchTickets.filter(videoEditorQaReturn)
  const thumbWorkTickets = batchTickets.filter(videoNeedsEditorThumbnailsSubmit)
  const titleWorkTickets = batchTickets.filter(videoNeedsEditorTitleSubmit)

  const vc = videoCountForBatch(batch, batchTickets)
  const thumbsReady = batchThumbnailsCompleteInManifest(manifest, vc)

  const activeThumbIndex = useMemo(() => {
    if (thumbWorkTickets.some((t) => deliverableIndexForTicket(t) === thumbPick)) {
      return thumbPick
    }
    const first = thumbWorkTickets[0]
    return first ? deliverableIndexForTicket(first) : 1
  }, [thumbWorkTickets, thumbPick])

  const selectedThumbTicket = thumbWorkTickets.find(
    (t) => deliverableIndexForTicket(t) === activeThumbIndex,
  )

  const titlesHandedOffForBatch =
    batchTickets.length > 0 &&
    titleWorkTickets.length === 0 &&
    batchTickets.every((t) => !videoNeedsEditorTitleSubmit(t)) &&
    batchTickets.some((t) => Boolean(t.editorPublishTitle?.trim()))

  async function handleSyncFromDrive() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const next = await reloadDriveManifestForBatch(batch.id)
      if (next) setManifestSnap(next)
      else setSyncMsg('No manifest for this batch yet.')
    } catch {
      setSyncMsg('Could not reload manifest — try a full page refresh.')
    } finally {
      setSyncing(false)
    }
  }

  if (!open) return null

  const showPrepClipHeader =
    Boolean(batch.clipsFolderUrl?.trim()) &&
    batchReadyForEditorWork(batch) &&
    !batch.editorDeliverablesDriveUrl?.trim()

  const headerAside =
    batch.editorDeliverablesDriveUrl?.trim() ? (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            void handleSyncFromDrive()
          }}
          disabled={syncing}
          className="border-border bg-muted/30 hover:border-primary/35 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden />
          Sync from Drive
        </button>
        <a
          href={batch.editorDeliverablesDriveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors"
        >
          Go to Drive
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
        {batch.clipsFolderUrl?.trim() ? (
          <a
            href={batch.clipsFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors"
          >
            Clips folder
            <ExternalLink className="size-3.5 opacity-70" aria-hidden />
          </a>
        ) : null}
      </div>
    ) : showPrepClipHeader ? (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            void handleSyncFromDrive()
          }}
          disabled={syncing}
          className="border-border bg-muted/30 hover:border-primary/35 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden />
          Sync from Drive
        </button>
      </div>
    ) : null

  const headerMeta = manifest ? (
    <>
      Last synced {formatSyncedAt(manifest.syncedAt)}
      {manifest.unmapped.length > 0 ? (
        <span className="text-destructive">
          {' '}
          · {manifest.unmapped.length} unmapped file(s)
        </span>
      ) : null}
    </>
  ) : (
    'No Drive manifest loaded.'
  )

  return (
    <StudioModalShell
      title={batch.title}
      subtitle={`${clientName} · Batch ${batch.batchNumber}`}
      titleId="editor-batch-workspace-title"
      headerMeta={headerMeta}
      headerAside={headerAside}
      onClose={onClose}
    >
      {syncMsg ? (
        <p className="text-destructive mb-3 text-xs leading-relaxed">{syncMsg}</p>
      ) : null}

      <div className="max-w-4xl space-y-8 pb-4">
        {batchAwaitingClips(batch) ? (
          <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm leading-relaxed">
            Clips are not approved yet for this batch. Once the client signs off, you can submit
            your deliverables folder and start the video QA loop.
          </p>
        ) : null}

        {!batch.editorDeliverablesDriveUrl?.trim() &&
        batch.clipsFolderUrl &&
        batchReadyForEditorWork(batch) ? (
          <section className="space-y-3">
            <h3 className="text-foreground text-xs font-semibold uppercase tracking-wide">
              Approved clips
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Reference cuts from the client-approved clips folder. Pick a clip on the right to preview
              the raw file — indexed names should align with deliverable numbers in Studio.
            </p>
            <div className="border-border flex min-h-[min(52vh,440px)] flex-col overflow-hidden rounded-xl border md:min-h-[440px]">
              <ClientClipReviewPanel
                batchId={batch.id}
                manifest={manifest}
                clipsFolderUrl={batch.clipsFolderUrl}
                readOnly
                sidebarPosition="right"
              />
            </div>
          </section>
        ) : null}

        {!batch.editorDeliverablesDriveUrl?.trim() && batchReadyForEditorWork(batch) ? (
          <section className="border-border space-y-4 rounded-xl border p-4">
            <h3 className="text-foreground text-xs font-semibold uppercase tracking-wide">
              Submit videos
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              After editing, create a shared Drive folder with a{' '}
              <span className="text-foreground font-medium">Videos</span> subfolder containing each
              final. Paste the deliverables folder link below — this starts SMM video QA.
            </p>
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                Deliverables folder URL
              </span>
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => {
                  setDriveUrl(e.target.value)
                }}
                placeholder="https://drive.google.com/drive/folders/…"
                className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!driveUrl.trim()}
                onClick={() => {
                  submitEditorVideosDrive(batch.id, driveUrl)
                  onClose()
                }}
                className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                Submit videos
              </button>
            </div>
          </section>
        ) : null}

        {qaFixTickets.length > 0 ? (
          <section className="space-y-4">
            <h3 className="text-foreground text-xs font-semibold uppercase tracking-wide">
              Video QA — your fixes
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Same view as SMM/client QA: finish cuts on Drive, then resubmit. Prior video comments
              are archived as resolved for this upload.
            </p>
            {qaFixTickets.map((t) => (
              <EditorQaFixPanel
                key={t.id}
                batch={batch}
                clientName={clientName}
                ticket={t}
                fallbackVideoSrc={SAMPLE_VIDEO_SRC}
              />
            ))}
          </section>
        ) : null}

        {thumbWorkTickets.length > 0 ? (
          <section className="space-y-4">
            <h3 className="text-foreground text-xs font-semibold uppercase tracking-wide">
              Thumbnails — upload &amp; preview
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Add images next to <span className="text-foreground font-medium">Videos</span> under a{' '}
              <span className="text-foreground font-medium">Thumbnail</span> folder. Sync from Drive,
              then confirm side-by-side previews before sending to the client.
            </p>
            {!batch.editorDeliverablesDriveUrl?.trim() ? (
              <p className="text-muted-foreground text-xs">Save a deliverables folder first.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {thumbWorkTickets.map((t) => {
                    const idx = deliverableIndexForTicket(t)
                    const sel = idx === activeThumbIndex
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setThumbPick(idx)
                        }}
                        className={[
                          'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                          sel
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/40 text-foreground hover:bg-muted/55',
                        ].join(' ')}
                      >
                        Video {idx}
                      </button>
                    )
                  })}
                </div>
                {selectedThumbTicket ? (
                  <DeliverableVideoThumbnailTitleBlock
                    theme={theme}
                    videoDriveFileId={
                      getMediaEntry(batch.id, 'videos', activeThumbIndex)?.driveFileId
                    }
                    fallbackVideoSrc={
                      getMediaEntry(batch.id, 'videos', activeThumbIndex)?.driveFileId
                        ? undefined
                        : SAMPLE_VIDEO_SRC
                    }
                    videoFileName={getMediaEntry(batch.id, 'videos', activeThumbIndex)?.name}
                    thumbnailDriveFileId={
                      getMediaEntry(batch.id, 'thumbnails', activeThumbIndex)?.driveFileId
                    }
                    thumbnailFileName={
                      getMediaEntry(batch.id, 'thumbnails', activeThumbIndex)?.name
                    }
                    displayVideoTitle={selectedThumbTicket.title}
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!thumbsReady}
                    onClick={() => {
                      submitEditorThumbnailsForReview(batch.id)
                      onClose()
                    }}
                    className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Send for client thumbnails review
                  </button>
                  {!thumbsReady ? (
                    <span className="text-muted-foreground text-xs">
                      Add every thumbnail in Drive for videos 1…{vc}, then sync.
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </section>
        ) : null}

        {titleWorkTickets.length > 0 ? (
          <section className="space-y-4">
            <h3 className="text-foreground text-xs font-semibold uppercase tracking-wide">
              Video titles — hand off to SMM
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Client approved thumbnails. Enter the publish title for each short — submissions go
              to your SMM for scheduling.
            </p>
            <ul className="space-y-4">
              {titleWorkTickets.map((t) => (
                <li
                  key={t.id}
                  className="border-border bg-muted/10 space-y-2 rounded-xl border p-4"
                >
                  <p className="text-foreground text-sm font-medium">
                    Video {deliverableIndexForTicket(t)} — {t.title}
                  </p>
                  <DeliverableVideoThumbnailTitleBlock
                    theme={theme}
                    videoDriveFileId={getMediaEntry(batch.id, 'videos', deliverableIndexForTicket(t))
                      ?.driveFileId}
                    fallbackVideoSrc={
                      getMediaEntry(batch.id, 'videos', deliverableIndexForTicket(t))?.driveFileId
                        ? undefined
                        : SAMPLE_VIDEO_SRC
                    }
                    videoFileName={
                      getMediaEntry(batch.id, 'videos', deliverableIndexForTicket(t))?.name
                    }
                    thumbnailDriveFileId={
                      getMediaEntry(batch.id, 'thumbnails', deliverableIndexForTicket(t))
                        ?.driveFileId
                    }
                    thumbnailFileName={
                      getMediaEntry(batch.id, 'thumbnails', deliverableIndexForTicket(t))?.name
                    }
                  />
                  <label className="block space-y-1.5">
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                      Publish title
                    </span>
                    <input
                      type="text"
                      value={titleDrafts[t.id] ?? ''}
                      onChange={(e) => {
                        setTitleDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                      }}
                      placeholder="Title for the scheduled post"
                      className="border-border bg-background w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!(titleDrafts[t.id] ?? '').trim()}
                    onClick={() => {
                      submitEditorVideoTitle(t.id, titleDrafts[t.id] ?? '')
                    }}
                    className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Send title to SMM
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {titlesHandedOffForBatch ? (
          <section
            className="border-border text-foreground rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm"
            role="status"
          >
            All publish titles in this batch are with Scale Brands for scheduling.
          </section>
        ) : null}

        {batchTickets.length > 0 &&
        !batchAwaitingClips(batch) &&
        qaFixTickets.length === 0 &&
        thumbWorkTickets.length === 0 &&
        titleWorkTickets.length === 0 &&
        batch.editorDeliverablesDriveUrl ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nothing is waiting on you in this batch right now — check back when QA sends notes or the
            next phase opens.
          </p>
        ) : null}
      </div>
    </StudioModalShell>
  )
}
