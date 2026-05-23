import type { DeliverableDriveSyncRequest, DriveMediaEntryInput } from '@/client'
import type { BatchDriveManifest, DriveMediaEntry } from '@/lib/driveMedia'

function toEntryInput(entry: DriveMediaEntry): DriveMediaEntryInput {
  return {
    index: entry.index,
    driveFileId: entry.driveFileId,
    name: entry.name,
    mimeType: entry.mimeType,
    modifiedTime: entry.modifiedTime,
  }
}

export function driveSyncRequestFromManifest(
  deliverableIndex: number,
  manifest: BatchDriveManifest | undefined,
): DeliverableDriveSyncRequest | null {
  if (!manifest) return null
  const video = manifest.videos.find((e) => e.index === deliverableIndex)
  const thumbnail = manifest.thumbnails.find((e) => e.index === deliverableIndex)
  if (!video && !thumbnail) return null
  return {
    deliverableIndex,
    video: video ? toEntryInput(video) : undefined,
    thumbnail: thumbnail ? toEntryInput(thumbnail) : undefined,
    syncedAt: manifest.syncedAt ?? new Date().toISOString(),
  }
}
