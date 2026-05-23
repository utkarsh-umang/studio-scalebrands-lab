import type { AdminVideoTicket } from '@mockData/index'
import type { BatchDriveManifest, DriveMediaEntry } from '@/lib/driveMedia'
import { getMediaEntry } from '@/lib/driveMedia'

export type DeliverableReadiness = {
  videoReady: boolean
  thumbnailReady: boolean
  titleReady: boolean
  allReady: boolean
}

function entryFromManifest(
  manifest: BatchDriveManifest | undefined,
  slot: 'videos' | 'thumbnails',
  index: number,
) {
  if (!manifest) return undefined
  const list = slot === 'videos' ? manifest.videos : manifest.thumbnails
  return list.find((e) => e.index === index)
}

function entryFromTicketSlots(
  ticket: AdminVideoTicket | undefined,
  slot: 'video' | 'thumbnail',
): DriveMediaEntry | undefined {
  const raw = ticket?.deliverableDriveSlots?.[slot]
  if (!raw || typeof raw !== 'object') return undefined
  const driveFileId = String(
    (raw as { driveFileId?: string; drive_file_id?: string }).driveFileId ??
      (raw as { drive_file_id?: string }).drive_file_id ??
      '',
  ).trim()
  if (!driveFileId) return undefined
  const index = Number((raw as { index?: number }).index ?? ticket?.deliverableIndex ?? 0)
  return {
    index,
    driveFileId,
    name: String((raw as { name?: string }).name ?? ''),
    mimeType: String((raw as { mimeType?: string }).mimeType ?? ''),
    modifiedTime: String((raw as { modifiedTime?: string }).modifiedTime ?? ''),
  }
}

export function readinessForDeliverable(
  batchId: string,
  deliverableIndex: number,
  ticket: AdminVideoTicket | undefined,
  manifest?: BatchDriveManifest,
): DeliverableReadiness {
  const videoReady = Boolean(
    entryFromTicketSlots(ticket, 'video') ??
      entryFromManifest(manifest, 'videos', deliverableIndex) ??
      getMediaEntry(batchId, 'videos', deliverableIndex),
  )
  const thumbnailReady = Boolean(
    entryFromTicketSlots(ticket, 'thumbnail') ??
      entryFromManifest(manifest, 'thumbnails', deliverableIndex) ??
      getMediaEntry(batchId, 'thumbnails', deliverableIndex),
  )
  const titleReady = Boolean(ticket?.editorPublishTitle?.trim())
  return {
    videoReady,
    thumbnailReady,
    titleReady,
    allReady: videoReady && thumbnailReady && titleReady,
  }
}
