import type { AdminVideoTicket } from '@mockData/index'
import type { BatchDriveManifest } from '@/lib/driveMedia'
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

export function readinessForDeliverable(
  batchId: string,
  deliverableIndex: number,
  ticket: AdminVideoTicket | undefined,
  manifest?: BatchDriveManifest,
): DeliverableReadiness {
  const videoReady = Boolean(
    entryFromManifest(manifest, 'videos', deliverableIndex) ??
      getMediaEntry(batchId, 'videos', deliverableIndex),
  )
  const thumbnailReady = Boolean(
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
