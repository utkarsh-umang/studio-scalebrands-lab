import type { AdminVideoTicket } from '@mockData/index'
import type { DriveMediaEntry } from '@mockData/driveManifests'
import { videoNeedsClientFinalReview, videoNeedsClientThumbnailReview } from '@/lib/clientBoard'
import { deliverableIndexForTicket } from '@/lib/driveMedia'

/** One numbered slot in Video/ — manifest entry + optional Studio ticket */
export type DeliverableSidebarRow = {
  index: number
  entry?: DriveMediaEntry
  ticket?: AdminVideoTicket
}

/** Sidebar rows for SMM batch QA (manifest + all batch ticket indices). */
export function buildDeliverableSidebarRows(
  batchId: string,
  manifestVideos: DriveMediaEntry[] | undefined,
  tickets: AdminVideoTicket[],
): DeliverableSidebarRow[] {
  const batchTickets = tickets.filter((t) => t.batchId === batchId)
  const ticketByIndex = new Map<number, AdminVideoTicket>()
  for (const t of batchTickets) {
    ticketByIndex.set(deliverableIndexForTicket(t), t)
  }

  const indices = new Set<number>()
  for (const v of manifestVideos ?? []) indices.add(v.index)
  for (const t of batchTickets) indices.add(deliverableIndexForTicket(t))

  return [...indices]
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      entry: manifestVideos?.find((e) => e.index === index),
      ticket: ticketByIndex.get(index),
    }))
}

/**
 * Client final-video QA: only tickets the client should see (released + final review stage).
 * No manifest-only rows; internal SMM QA slots stay off the client sidebar.
 */
export function buildClientFinalReviewSidebarRows(
  batchId: string,
  manifestVideos: DriveMediaEntry[] | undefined,
  tickets: AdminVideoTicket[],
): DeliverableSidebarRow[] {
  const eligible = tickets.filter(
    (t) => t.batchId === batchId && videoNeedsClientFinalReview(t),
  )
  const byIndex = new Map<number, AdminVideoTicket>()
  for (const t of eligible) {
    byIndex.set(deliverableIndexForTicket(t), t)
  }

  return [...byIndex.keys()]
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      entry: manifestVideos?.find((e) => e.index === index),
      ticket: byIndex.get(index)!,
    }))
}

/** Client thumbnail QA — same indexing as manifest videos; thumbnails read from Thumb slot. */
export function buildClientThumbnailReviewSidebarRows(
  batchId: string,
  manifestVideos: DriveMediaEntry[] | undefined,
  tickets: AdminVideoTicket[],
): DeliverableSidebarRow[] {
  const eligible = tickets.filter(
    (t) => t.batchId === batchId && videoNeedsClientThumbnailReview(t),
  )
  const byIndex = new Map<number, AdminVideoTicket>()
  for (const t of eligible) {
    byIndex.set(deliverableIndexForTicket(t), t)
  }

  return [...byIndex.keys()]
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      entry: manifestVideos?.find((e) => e.index === index),
      ticket: byIndex.get(index)!,
    }))
}
