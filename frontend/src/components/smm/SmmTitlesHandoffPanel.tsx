import { useMemo, useState } from 'react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DeliverableVideoThumbnailTitleBlock } from '@/components/drive/DeliverableVideoThumbnailTitleBlock'
import { DeliverableSidebarList } from '@/components/drive/DeliverableSidebarList'
import { buildDeliverableSidebarRows } from '@/lib/deliverableSidebar'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import {
  deliverableIndexForTicket,
  getMediaEntry,
} from '@/lib/driveMedia'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  batchTickets: AdminVideoTicket[]
  manifest: BatchDriveManifest | undefined
}

/** Editor-supplied titles + Drive finals — read-only reference in Studio. */
export function SmmTitlesHandoffPanel({ batch, batchTickets, manifest }: Props) {
  const { theme } = useTheme()
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

            <DeliverableVideoThumbnailTitleBlock
              theme={theme}
              videoDriveFileId={videoEntry?.driveFileId}
              videoFileName={videoEntry?.name}
              thumbnailDriveFileId={thumbEntry?.driveFileId}
              thumbnailFileName={thumbEntry?.name}
              displayVideoTitle={titleText || undefined}
            />
          </div>
        )}
      </div>

      <DeliverableSidebarList
        rows={rows.map((row) => ({
          index: row.index,
          label: row.ticket?.editorPublishTitle ?? row.entry?.name ?? '—',
        }))}
        selectedIndex={selectedRow?.index ?? null}
        onSelect={setSelectedIndex}
      />
    </div>
  )
}
