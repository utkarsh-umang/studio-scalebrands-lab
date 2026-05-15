import type { AdminVideoTicket, QaComment, QaMediaSlot } from '@mockData/index'
import type { VideoReviewFeedback } from '@/components/VideoDeliverableReviewPanel'

export function buildQaCommentsFromFeedback(
  feedback: VideoReviewFeedback,
  opts: {
    slot: QaMediaSlot
    assetVersion: number
    authorRole: QaComment['authorRole']
  },
): QaComment[] {
  const createdAt = new Date().toISOString()
  const out: QaComment[] = []
  for (const m of feedback.markers) {
    out.push({
      id: `qc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      slot: opts.slot,
      assetVersion: opts.assetVersion,
      kind: 'timestamp',
      authorRole: opts.authorRole,
      atSeconds: m.at,
      body: m.text,
      createdAt,
      deprecated: false,
    })
  }
  if (feedback.generalNote.trim()) {
    out.push({
      id: `qc-${Date.now()}-g-${Math.random().toString(36).slice(2, 8)}`,
      slot: opts.slot,
      assetVersion: opts.assetVersion,
      kind: 'general',
      authorRole: opts.authorRole,
      body: feedback.generalNote.trim(),
      createdAt,
      deprecated: false,
    })
  }
  return out
}

export function appendClipRejectNote(
  ticket: AdminVideoTicket,
  note: string,
): QaComment[] {
  const createdAt = new Date().toISOString()
  const comment: QaComment = {
    id: `qc-clip-${Date.now()}`,
    slot: 'clip',
    assetVersion: ticket.assetVersions?.clip ?? 1,
    kind: 'clip_note',
    authorRole: 'client',
    body: note.trim(),
    createdAt,
    deprecated: false,
  }
  return [...(ticket.qaCommentHistory ?? []), comment]
}

export function flagsToQaComments(
  ticket: AdminVideoTicket,
  slot: QaMediaSlot,
): QaComment[] {
  const version = ticket.assetVersions?.[slot] ?? 1
  const history = ticket.qaCommentHistory ?? []
  if (history.length > 0) return history

  const legacy: QaComment[] = []
  const createdAt = new Date().toISOString()
  for (const f of ticket.qaFlags ?? []) {
    legacy.push({
      id: f.id,
      slot,
      assetVersion: version,
      kind: 'timestamp',
      authorRole: 'smm',
      atSeconds: f.atSeconds,
      body: f.note,
      createdAt,
      deprecated: false,
    })
  }
  if (ticket.qaGeneralNote?.trim()) {
    legacy.push({
      id: `legacy-general-${ticket.id}`,
      slot,
      assetVersion: version,
      kind: 'general',
      authorRole: 'smm',
      body: ticket.qaGeneralNote.trim(),
      createdAt,
      deprecated: false,
    })
  }
  return legacy
}

export function activeCommentsForSlot(
  comments: QaComment[] | undefined,
  slot: QaMediaSlot,
): QaComment[] {
  return (comments ?? []).filter((c) => c.slot === slot && !c.deprecated)
}

export function markersFromComments(comments: QaComment[]): { at: number; text: string }[] {
  return comments
    .filter((c) => c.kind === 'timestamp' && c.atSeconds != null && !c.deprecated)
    .map((c) => ({ at: c.atSeconds!, text: c.body }))
}

export function generalFromComments(comments: QaComment[]): string {
  return comments
    .filter((c) => c.kind === 'general' && !c.deprecated)
    .map((c) => c.body)
    .join('\n\n')
}
