/**
 * Prototype-only editor dashboard payload.
 * Wire to API later; keep shapes close to eventual domain models.
 */

export type EditorTaskKind = 'raw_footage_clip' | 'full_edit'

/** Mirrors problem-context lifecycle labels for the editor-facing UI */
export type EditorTaskStatus =
  | 'editing'
  | 'smm_qa'
  | 'qa_flagged'

export type QaFlagKind = 'timestamp' | 'general'

export type EditorQaFlag = {
  id: string
  kind: QaFlagKind
  /** Seconds into the video when kind === 'timestamp' */
  atSeconds?: number
  note: string
}

export type EditorTaskSummary = {
  id: string
  batchTitle: string
  /** Short client / account label for internal context */
  accountLabel: string
  kind: EditorTaskKind
  status: EditorTaskStatus
  stageLabel: string
  /** ISO date string */
  updatedAt: string
  /** ISO date string — set when Admin assigns a deadline */
  deadline?: string
}

export type EditorTaskDetail = EditorTaskSummary & {
  footageUrl?: string
  footageLabel?: string
  /** Copy from SMM for full_edit tasks */
  thumbnailTitle?: string
  videoTitle?: string
  /** Sample player source for mock preview */
  previewVideoSrc?: string
  thumbnailAlt?: string
  qaFlags: EditorQaFlag[]
}

export type EditorDashboardMock = {
  /** Counts for summary cards */
  counts: {
    editing: number
    withSmmQa: number
    qaInbox: number
  }
  needsAttention: EditorTaskSummary[]
  inProgress: EditorTaskSummary[]
}

function toSummary(d: EditorTaskDetail): EditorTaskSummary {
  return {
    id: d.id,
    batchTitle: d.batchTitle,
    accountLabel: d.accountLabel,
    kind: d.kind,
    status: d.status,
    stageLabel: d.stageLabel,
    updatedAt: d.updatedAt,
    deadline: d.deadline,
  }
}

/** Derived from `MOCK_EDITOR_TASKS` for overview + lists */
export function getMockEditorDashboard(): EditorDashboardMock {
  const tasks = Object.values(MOCK_EDITOR_TASKS)
  const needsAttention = tasks
    .filter((t) => t.status === 'qa_flagged')
    .map(toSummary)
    .sort((a, b) => (a.deadline && b.deadline ? a.deadline.localeCompare(b.deadline) : 0))
  const inProgress = tasks
    .filter((t) => t.status !== 'qa_flagged')
    .map(toSummary)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  const editing = tasks.filter((t) => t.status === 'editing').length
  const withSmmQa = tasks.filter((t) => t.status === 'smm_qa').length
  const qaInbox = tasks.filter((t) => t.status === 'qa_flagged').length
  return {
    counts: { editing, withSmmQa, qaInbox },
    needsAttention,
    inProgress,
  }
}

const PREVIEW =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm'

export const MOCK_EDITOR_TASKS: Record<string, EditorTaskDetail> = {
  't-314': {
    id: 't-314',
    batchTitle: 'Founder story — batch 2',
    accountLabel: 'Acme SaaS',
    kind: 'full_edit',
    status: 'qa_flagged',
    stageLabel: 'QA flagged — needs your fix',
    updatedAt: '2026-04-30',
    deadline: '2026-05-02',
    thumbnailTitle: 'From garage to Series B',
    videoTitle: 'The bet that almost broke us (and didn’t)',
    previewVideoSrc: PREVIEW,
    thumbnailAlt: 'Founder at whiteboard',
    qaFlags: [
      {
        id: 'f1',
        kind: 'timestamp',
        atSeconds: 12,
        note: 'Lower third clashes with product UI — lighten or shorten.',
      },
      {
        id: 'f2',
        kind: 'general',
        note: 'Thumbnail text feels cramped on mobile safe zone; try two lines.',
      },
    ],
  },
  't-302': {
    id: 't-302',
    batchTitle: 'Weekly Shorts — April',
    accountLabel: 'Northwind',
    kind: 'raw_footage_clip',
    status: 'qa_flagged',
    stageLabel: 'QA flagged — needs your fix',
    updatedAt: '2026-04-28',
    deadline: '2026-05-01',
    footageUrl: 'https://example.com/footage/northwind-apr',
    footageLabel: 'April all-hands B-roll — link only (v1)',
    previewVideoSrc: PREVIEW,
    thumbnailAlt: 'Office b-roll',
    qaFlags: [
      {
        id: 'f1',
        kind: 'timestamp',
        atSeconds: 4,
        note: 'Hard cut feels abrupt; add 4 frames of L-cut under VO.',
      },
    ],
  },
  't-318': {
    id: 't-318',
    batchTitle: 'Spring launch teasers',
    accountLabel: 'Acme SaaS',
    kind: 'full_edit',
    status: 'editing',
    stageLabel: 'Editing in progress',
    updatedAt: '2026-04-29',
    deadline: '2026-05-04',
    thumbnailTitle: 'Ship the spring drop',
    videoTitle: 'Spring launch: what’s actually shipping',
    previewVideoSrc: PREVIEW,
    thumbnailAlt: 'Product hero',
    qaFlags: [],
  },
  't-320': {
    id: 't-320',
    batchTitle: 'Q2 product clips',
    accountLabel: 'Globex',
    kind: 'raw_footage_clip',
    status: 'editing',
    stageLabel: 'Clip cut — first pass',
    updatedAt: '2026-04-29',
    footageUrl: 'https://example.com/footage/globex-q2',
    footageLabel: 'Product walkthrough master',
    previewVideoSrc: PREVIEW,
    thumbnailAlt: 'Dashboard UI',
    qaFlags: [],
  },
  't-305': {
    id: 't-305',
    batchTitle: 'Redis deep dive clip',
    accountLabel: 'Contoso',
    kind: 'full_edit',
    status: 'smm_qa',
    stageLabel: 'With SMM for QA',
    updatedAt: '2026-04-27',
    thumbnailTitle: 'Why Redis Feels Instant',
    videoTitle: 'Redis Deep Dive: Speed Secrets Most Devs Miss',
    previewVideoSrc: PREVIEW,
    thumbnailAlt: 'Redis terminal',
    qaFlags: [],
  },
}

/** Flat list for task index pages */
export function listEditorTaskSummaries(): EditorTaskSummary[] {
  return Object.values(MOCK_EDITOR_TASKS)
    .map(toSummary)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}
