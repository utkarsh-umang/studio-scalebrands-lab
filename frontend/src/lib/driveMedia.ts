import {
  DRIVE_MANIFESTS,
  type BatchDriveManifest,
  type DriveMediaEntry,
} from '@mockData/driveManifests'
import type { AdminVideoTicket, QaMediaSlot } from '@/types/pathB'

export type { BatchDriveManifest, DriveMediaEntry }

export function parseDriveFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return m?.[1] ?? null
}

/** Dev-only: share one synced manifest across demo batch ids */
const MANIFEST_ALIASES: Record<string, string> = {
  'b-smm-qa': 'b-204',
  'b-titles': 'b-204',
  'b-obs-final': 'b-204',
  'b-obs-thumb': 'b-204',
  'b-obs-edit': 'b-204',
  'b-ed-qa-smm': 'b-204',
  'b-ed-qa-client': 'b-204',
  'b-ed-thumbs': 'b-204',
  'b-ed-titles': 'b-204',
  /** Path B demo batches (context/path-b-ui-spec.md) */
  'b-clips': 'b-204',
  'b-clips-ready': 'b-204',
  'b-editing': 'b-204',
  'b-pipeline': 'b-204',
  'b-schedule': 'b-204',
  'b-identifying': 'b-204',
  'b-archive': 'b-204',
}

export function getManifestForBatch(batchId: string): BatchDriveManifest | undefined {
  const key = MANIFEST_ALIASES[batchId] ?? batchId
  return DRIVE_MANIFESTS[key]
}

/**
 * Re-import generated manifests so edits from `npm run drive:sync-manifests` show up
 * without a full page reload (best-effort in dev; falls back to latest bundled module).
 */
export async function reloadDriveManifestForBatch(
  batchId: string,
): Promise<BatchDriveManifest | undefined> {
  const mod = await import(
    /* @vite-ignore */
    `../../mockData/driveManifests.ts?t=${Date.now()}`
  )
  const key = MANIFEST_ALIASES[batchId] ?? batchId
  return mod.DRIVE_MANIFESTS[key]
}

export function getMediaEntry(
  batchId: string,
  slot: 'clips' | 'videos' | 'thumbnails',
  index: number,
): DriveMediaEntry | undefined {
  const manifest = getManifestForBatch(batchId)
  if (!manifest) return undefined
  const list =
    slot === 'clips' ? manifest.clips : slot === 'videos' ? manifest.videos : manifest.thumbnails
  return list.find((e) => e.index === index)
}

export function driveVideoPreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function driveFileViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}

export function driveThumbnailUrl(fileId: string, size = 1200): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`
}

export function deliverableIndexForTicket(ticket: AdminVideoTicket): number {
  if (ticket.deliverableIndex != null && ticket.deliverableIndex > 0) {
    return ticket.deliverableIndex
  }
  const m = ticket.title.match(/\b(\d+)\b/)
  return m ? parseInt(m[1]!, 10) : 1
}

export function assetVersionForSlot(
  ticket: AdminVideoTicket,
  slot: QaMediaSlot,
): number {
  return ticket.assetVersions?.[slot] ?? 1
}

export function listClipIndices(batchId: string): number[] {
  const manifest = getManifestForBatch(batchId)
  if (!manifest?.clips.length) return []
  return manifest.clips.map((c) => c.index)
}

/** True when manifest lists a thumbnail file for every index 1…videoCount */
export function batchThumbnailsCompleteInManifest(
  manifest: BatchDriveManifest | undefined,
  videoCount: number,
): boolean {
  if (!manifest?.thumbnails?.length || videoCount < 1) return false
  for (let i = 1; i <= videoCount; i++) {
    if (!manifest.thumbnails.some((t) => t.index === i)) return false
  }
  return true
}

export function formatSyncedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}
