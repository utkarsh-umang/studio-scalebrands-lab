import { useMemo, useState } from 'react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DriveOrStreamVideo } from '@/components/drive/DriveOrStreamVideo'
import { buildDeliverableSidebarRows } from '@/lib/deliverableSidebar'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import {
  deliverableIndexForTicket,
  driveThumbnailUrl,
  getMediaEntry,
} from '@/lib/driveMedia'

type Props = {
  batch: AdminBatchFolder
  batchTickets: AdminVideoTicket[]
  manifest: BatchDriveManifest | undefined
}

/** Editor-supplied titles + Drive finals — read-only reference in Studio. */
export function SmmTitlesHandoffPanel({ batch, batchTickets, manifest }: Props) {
  const manifestVideos = manifest?.videos
  const manifestThumbs = manifest?.thumbnails

  const rows = useMemo(
    () => buildDeliverableSidebarRows(batch.id, manifestVideos, batchTickets),
    [batch.id, manifestVideos, batchTickets],
  )

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const first = rows[0]?.ticket
    return first ? deliverableIndexForTicket(first) : 1
  })

  const selectedRow = rows.find((r) => r.index === selectedIndex) ?? rows[0] ?? null

  const videoEntry = selectedRow
    ? getMediaEntry(batch.id, 'videos', selectedRow.index)
    : undefined
  const thumbEntry =
    manifestThumbs?.find((e) => e.index === selectedRow?.index) ??
    getMediaEntry(batch.id, 'thumbnails', selectedRow?.index ?? 1)

  const titleText = selectedRow?.ticket?.editorPublishTitle?.trim() ?? ''

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 overflow-y-auto md:flex-row md:gap-6 md:overflow-hidden">
      <aside className="border-border bg-muted/15 flex max-h-[min(32vh,240px)] shrink-0 flex-col rounded-xl border pt-2 md:max-h-none md:w-56 md:bg-transparent md:pt-0">
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 md:px-0">
          {rows.map((row) => {
            const active = row.index === selectedRow?.index
            return (
              <li key={row.index}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIndex(row.index)
                  }}
                  className={[
                    'flex w-full flex-col rounded-lg px-2 py-2 text-left text-xs transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/25 hover:bg-muted/45 text-foreground',
                  ].join(' ')}
                >
                  <span className="font-semibold tabular-nums">Video {row.index}</span>
                  <span
                    className={[
                      'mt-0.5 line-clamp-2 font-normal opacity-90',
                      active ? 'text-primary-foreground/85' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {row.ticket?.editorPublishTitle ?? row.entry?.name ?? '—'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto md:pr-1">
        {!selectedRow ? (
          <p className="text-muted-foreground text-sm">Select a slot on the left.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
              <span className="border-border bg-muted/30 text-foreground rounded-md border px-2 py-1">
                video_{selectedRow.index}
              </span>
              <span className="border-border bg-muted/30 text-foreground rounded-md border px-2 py-1">
                thumbnail_{selectedRow.index}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                  Video preview
                </p>
                {videoEntry?.driveFileId ? (
                  <DriveOrStreamVideo
                    driveFileId={videoEntry.driveFileId}
                    fileName={videoEntry.name}
                    layout="portrait"
                  />
                ) : (
                  <p className="text-muted-foreground text-xs">No synced video file for this index.</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                  Thumbnail
                </p>
                {thumbEntry?.driveFileId ? (
                  <img
                    src={driveThumbnailUrl(thumbEntry.driveFileId)}
                    alt=""
                    className="border-border bg-muted/20 w-full max-w-[240px] rounded-xl border object-cover"
                  />
                ) : (
                  <p className="text-muted-foreground text-xs">No thumbnail file for this index yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`smm-title-${selectedRow.index}`}
                className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide"
              >
                video_title_{selectedRow.index} (from editor)
              </label>
              <textarea
                id={`smm-title-${selectedRow.index}`}
                readOnly
                value={titleText || '—'}
                rows={3}
                className="border-border bg-muted/20 text-foreground pointer-events-none w-full resize-none rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
