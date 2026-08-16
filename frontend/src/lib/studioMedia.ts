import type { AdminVideoTicket } from '@/types/pathB'

export type StudioMediaSlot = {
  assetId: string
  objectKey?: string
  name: string
  mimeType?: string
  version?: number
}

export function studioMediaSlot(
  ticket: AdminVideoTicket | undefined,
  kind: 'video' | 'thumbnail',
): StudioMediaSlot | undefined {
  const raw = ticket?.deliverableDriveSlots?.[kind]
  if (!raw || typeof raw !== 'object') return undefined
  const assetId = String((raw as { assetId?: string; asset_id?: string }).assetId ??
    (raw as { asset_id?: string }).asset_id ?? '').trim()
  if (!assetId) return undefined
  return {
    assetId,
    objectKey: String((raw as { objectKey?: string }).objectKey ?? '') || undefined,
    name: String((raw as { name?: string }).name ?? `${kind} asset`),
    mimeType: String((raw as { mimeType?: string }).mimeType ?? '') || undefined,
    version: Number((raw as { version?: number }).version ?? 0) || undefined,
  }
}
