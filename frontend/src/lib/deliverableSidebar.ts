import type { AdminVideoTicket } from '@mockData/index'
import type { DriveMediaEntry } from '@mockData/driveManifests'
import { videoNeedsClientFinalReview } from '@/lib/clientBoard'
import { deliverableIndexForTicket } from '@/lib/driveMedia'

/** One numbered slot in Video/ — manifest entry + optional Studio ticket */
export type DeliverableSidebarRow = {
  index: number
  entry?: DriveMediaEntry
  ticket?: AdminVideoTicket
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
