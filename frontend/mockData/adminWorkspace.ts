/**
 * Admin workspace — clients, batch folders, video tickets (frontend prototype).
 */

export type BrandGuidelinesSource = 'internal' | 'client' | 'google_doc'

export type AdminClientAccountStatus = 'active' | 'decommissioned'

export type AdminClientProfile = {
  id: string
  loginId: string
  /** Demo-only; admin-visible credential for client portal login */
  password: string
  displayName: string
  credits: number
  accountStatus: AdminClientAccountStatus
  decommissionReason?: string
  decommissionedAt?: string
  createdAt: string
  assignedSmmId: string
  assignedSmmName: string
  assignedEditorId: string
  assignedEditorName: string
  brandGuidelines: {
    source: BrandGuidelinesSource
    summary: string
    googleDocUrl?: string
    lastUpdatedAt: string
  }
}

export type AdminBatchFolderStatus = 'active' | 'completed'

/** How the client kicks off the batch. */
export type BatchIntakePath = 'source_media' | 'clips_ready'

/**
 * Clip identification lifecycle (source_media path only).
 * clips_ready skips straight to editor after intake.
 */
export type BatchClipReviewPhase =
  | 'smm_identifying'
  | 'awaiting_client'
  | 'with_smm'
  | 'approved'

export type BatchFootageFile = {
  id: string
  name: string
  /** External URL when linked; local picks store name only in prototype */
  url?: string
}

/** SMM QA — timestamp note on the edited video */
export type VideoQaTimestampFlag = {
  id: string
  atSeconds: number
  note: string
}

export type QaMediaSlot = 'clip' | 'video' | 'thumbnail'

export type QaCommentKind = 'timestamp' | 'general' | 'clip_note'

export type QaComment = {
  id: string
  slot: QaMediaSlot
  assetVersion: number
  kind: QaCommentKind
  authorRole: 'smm' | 'client' | 'editor'
  atSeconds?: number
  body: string
  createdAt: string
  deprecated: boolean
}

/** Recorded when SMM marks a batch complete after scheduling all videos */
export type BatchScheduleRecord = {
  platform: string
  goLiveAt: string
  completedAt: string
  videoPublishLinks: Record<string, string | undefined>
}

export type AdminBatchFolder = {
  id: string
  clientId: string
  /** Sequential per client — batch 4 active means 3 prior completed cycles */
  batchNumber: number
  title: string
  status: AdminBatchFolderStatus
  videoCount: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  /** Set when SMM confirms all videos in the batch are scheduled */
  batchSchedule?: BatchScheduleRecord
  /** @deprecated use sourceMediaUrl — kept for admin create-batch modal */
  footageUrl?: string
  footageFiles?: BatchFootageFile[]
  intakePath?: BatchIntakePath
  /** Podcast platform URL or Drive/Dropbox raw footage (source_media path). */
  sourceMediaUrl?: string
  /** SMM clip cuts folder shared with client, or client's pre-cut clips folder. */
  clipsFolderUrl?: string
  clipReviewPhase?: BatchClipReviewPhase
  /** Credits reserved for this batch — debited when every video reaches Done */
  creditCost: number
  creditsDebited: boolean
  /**
   * Shared Drive folder for editor deliverables (Videos + Thumbnails subfolders).
   * Set when the editor shares the link after uploading finals.
   */
  editorDeliverablesDriveUrl?: string
}

/** Editor-facing workflow column on the deliverables board. */
export type EditorWorkflowPhase = 'videos' | 'thumbnails' | 'titles' | 'handed_off'

/** Operational owner for admin board columns */
export type VideoPipelineOwner = 'client' | 'smm' | 'editor' | 'scheduling' | 'done'

export type AdminVideoTicket = {
  id: string
  batchId: string
  clientId: string
  title: string
  owner: VideoPipelineOwner
  /** Human-readable step within the raw-footage path */
  stageLabel: string
  /** Who gets the deadline when set — matches current owner if SMM or Editor */
  deadlineRole: 'smm' | 'editor' | null
  deadlineAt: string | null
  /** SMM QA flags returned to the editor */
  qaFlags?: VideoQaTimestampFlag[]
  qaGeneralNote?: string
  /** Where the ticket sits on the editor 3-column board */
  editorPhase?: EditorWorkflowPhase
  /** Title the editor sends to SMM after the QA cycle */
  editorPublishTitle?: string
  /** 1…n — aligns with numbered Drive files in clips / videos / thumbnails folders */
  deliverableIndex?: number
  /** Per-slot version — bumps when Drive sync detects file change */
  assetVersions?: Partial<Record<QaMediaSlot, number>>
  /** Who last requested a revision (controls resubmit routing) */
  lastRevisionRequestedBy?: 'smm' | 'client'
  /**
   * When false, this deliverable is hidden from the client final-video QA UI (still in
   * internal SMM/editor video QA, or not yet handed off). When true, the client may see
   * it once the pipeline stage is final review. When omitted, derive from stage/owner
   * (see `videoNeedsClientFinalReview` in clientBoard).
   */
  releasedToClientFinalVideoReview?: boolean
  /** Full QA thread; older entries marked deprecated on re-upload */
  qaCommentHistory?: QaComment[]
}

export type StaffMember = {
  id: string
  name: string
  role: 'smm' | 'editor'
}

export const MOCK_STAFF_SMM: StaffMember[] = [
  { id: 'u-smm-1', name: 'Priya', role: 'smm' },
  { id: 'u-smm-2', name: 'Jordan', role: 'smm' },
]

export const MOCK_STAFF_EDITORS: StaffMember[] = [
  { id: 'u-editor-1', name: 'Arnav', role: 'editor' },
  { id: 'u-editor-2', name: 'Sam', role: 'editor' },
]

export const MOCK_ADMIN_CLIENT_PROFILES: AdminClientProfile[] = [
  {
    id: 'c-1',
    loginId: 'client@scalebrandslab.demo',
    password: 'demo1234',
    displayName: 'TechWithTim',
    credits: 42,
    accountStatus: 'active',
    createdAt: '2026-01-12',
    assignedSmmId: 'u-smm-1',
    assignedSmmName: 'Priya',
    assignedEditorId: 'u-editor-1',
    assignedEditorName: 'Arnav',
    brandGuidelines: {
      source: 'google_doc',
      summary:
        'Tone: energetic, educator-first. Avoid competitor mentions. Lower-thirds use brand blue (#1F57F5).',
      googleDocUrl: 'https://docs.google.com/document/d/example-techwithtim',
      lastUpdatedAt: '2026-04-10',
    },
  },
  {
    id: 'c-2',
    loginId: 'northwind.media',
    password: 'demo1234',
    displayName: 'Northwind Media',
    credits: 18,
    accountStatus: 'active',
    createdAt: '2026-02-03',
    assignedSmmId: 'u-smm-1',
    assignedSmmName: 'Priya',
    assignedEditorId: 'u-editor-1',
    assignedEditorName: 'Arnav',
    brandGuidelines: {
      source: 'internal',
      summary:
        'B2B SaaS — calm, authoritative voice. Thumbnails: minimal text, logo bottom-right.',
      lastUpdatedAt: '2026-03-22',
    },
  },
  {
    id: 'c-3',
    loginId: 'brightline.studio',
    password: 'demo1234',
    displayName: 'Brightline Co.',
    credits: 6,
    accountStatus: 'active',
    createdAt: '2026-03-20',
    assignedSmmId: 'u-smm-1',
    assignedSmmName: 'Priya',
    assignedEditorId: 'u-editor-1',
    assignedEditorName: 'Arnav',
    brandGuidelines: {
      source: 'client',
      summary:
        'Pastel palette, rounded sans, always include “Brightline” wordmark on thumb.',
      lastUpdatedAt: '2026-04-28',
    },
  },
]

/**
 * Prototype batches — each *active* row is one coherent stage of the raw-footage path.
 * Deliverable tickets `1…n` stay in sync within a batch (same cohort), except the
 * single clip-approval gate ticket (`Clip review`) before indices exist in Studio.
 */
const DRIVE_CLIPS =
  'https://drive.google.com/drive/folders/13Dw03A1s7tLQOBm8jj5XmwzxR94AK1ut'
const DRIVE_EDITOR_ROOT =
  'https://drive.google.com/drive/folders/1lnwiGh3b-UQ5PYwPvWmvpRxOcRpSjFkV'

/** Prototype: one clean TechWithTim storyline + a single 15-video archive. */
export const MOCK_ADMIN_BATCH_FOLDERS: AdminBatchFolder[] = [
  {
    id: 'b-yet',
    clientId: 'c-1',
    batchNumber: 20,
    title: 'June podcast — yet to start',
    status: 'active',
    videoCount: 0,
    createdAt: '2026-05-15',
    updatedAt: '2026-05-15',
    intakePath: 'source_media',
    sourceMediaUrl:
      'https://www.youtube.com/watch?v=example-techwithtim-may-podcast',
    footageUrl:
      'https://www.youtube.com/watch?v=example-techwithtim-may-podcast',
    clipReviewPhase: 'smm_identifying',
    creditCost: 5,
    creditsDebited: false,
  },
  {
    id: 'b-smm-qa',
    clientId: 'c-1',
    batchNumber: 21,
    title: 'Q2 cuts — SMM video QA',
    status: 'active',
    videoCount: 4,
    createdAt: '2026-05-10',
    updatedAt: '2026-05-14',
    intakePath: 'source_media',
    sourceMediaUrl:
      'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    footageUrl:
      'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'approved',
    creditCost: 4,
    creditsDebited: false,
    editorDeliverablesDriveUrl: DRIVE_EDITOR_ROOT,
  },
  {
    id: 'b-titles',
    clientId: 'c-1',
    batchNumber: 22,
    title: 'Product drop — editor titles in Drive',
    status: 'active',
    videoCount: 4,
    createdAt: '2026-05-12',
    updatedAt: '2026-05-14',
    intakePath: 'source_media',
    sourceMediaUrl:
      'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'approved',
    creditCost: 4,
    creditsDebited: false,
    editorDeliverablesDriveUrl: DRIVE_EDITOR_ROOT,
  },
  {
    id: 'b-obs-final',
    clientId: 'c-1',
    batchNumber: 23,
    title: 'Spring set — client on final video QA',
    status: 'active',
    videoCount: 4,
    createdAt: '2026-05-08',
    updatedAt: '2026-05-14',
    intakePath: 'source_media',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'approved',
    creditCost: 4,
    creditsDebited: false,
    editorDeliverablesDriveUrl: DRIVE_EDITOR_ROOT,
  },
  {
    id: 'b-obs-thumb',
    clientId: 'c-1',
    batchNumber: 24,
    title: 'Campaign B — thumbnail approval window',
    status: 'active',
    videoCount: 4,
    createdAt: '2026-05-09',
    updatedAt: '2026-05-14',
    intakePath: 'source_media',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'approved',
    creditCost: 4,
    creditsDebited: false,
    editorDeliverablesDriveUrl: DRIVE_EDITOR_ROOT,
  },
  {
    id: 'b-obs-edit',
    clientId: 'c-1',
    batchNumber: 25,
    title: 'B-roll pack — with editor (clips approved)',
    status: 'active',
    videoCount: 4,
    createdAt: '2026-05-11',
    updatedAt: '2026-05-14',
    intakePath: 'source_media',
    sourceMediaUrl:
      'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'approved',
    creditCost: 4,
    creditsDebited: false,
  },
  {
    id: 'b-archive-15',
    clientId: 'c-1',
    batchNumber: 9,
    title: 'Archive — fifteen-video cycle',
    status: 'completed',
    videoCount: 15,
    createdAt: '2026-03-01',
    updatedAt: '2026-04-01',
    completedAt: '2026-04-01',
    creditCost: 15,
    creditsDebited: true,
    batchSchedule: {
      platform: 'Instagram + YouTube + LinkedIn',
      goLiveAt: '2026-04-01T12:00:00.000Z',
      completedAt: '2026-04-01',
      videoPublishLinks: {},
    },
  },
]

function doneTicket(
  id: string,
  batchId: string,
  clientId: string,
  title: string,
  deliverableIndex: number,
): AdminVideoTicket {
  return {
    id,
    batchId,
    clientId,
    title,
    deliverableIndex,
    owner: 'done',
    stageLabel: 'Scheduled',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'handed_off',
  }
}

/**
 * Deliverable tickets — cohorts line up with each scenario batch above.
 */
const MOCK_ARCHIVE_DONE: AdminVideoTicket[] = Array.from({ length: 15 }, (_, i) => {
  const n = i + 1
  return doneTicket(
    `v-arch-${n}`,
    'b-archive-15',
    'c-1',
    `Archived deliverable ${n}`,
    n,
  )
})

export const MOCK_ADMIN_VIDEO_TICKETS: AdminVideoTicket[] = [
  ...MOCK_ARCHIVE_DONE,
  {
    id: 'v-sq-1',
    batchId: 'b-smm-qa',
    clientId: 'c-1',
    deliverableIndex: 1,
    title: 'Video 1 — REST vs GraphQL',
    owner: 'smm',
    stageLabel: 'SMM QA',
    deadlineRole: 'smm',
    deadlineAt: '2026-05-14T17:00:00.000Z',
    editorPhase: 'videos',
    releasedToClientFinalVideoReview: false,
  },
  {
    id: 'v-sq-2',
    batchId: 'b-smm-qa',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'Video 2 — auth deep dive',
    owner: 'smm',
    stageLabel: 'SMM QA',
    deadlineRole: 'smm',
    deadlineAt: '2026-05-14T17:00:00.000Z',
    editorPhase: 'videos',
    releasedToClientFinalVideoReview: false,
  },
  {
    id: 'v-sq-3',
    batchId: 'b-smm-qa',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'Video 3 — rate limits',
    owner: 'smm',
    stageLabel: 'SMM QA',
    deadlineRole: 'smm',
    deadlineAt: '2026-05-14T17:00:00.000Z',
    editorPhase: 'videos',
    releasedToClientFinalVideoReview: false,
  },
  {
    id: 'v-sq-4',
    batchId: 'b-smm-qa',
    clientId: 'c-1',
    deliverableIndex: 4,
    title: 'Video 4 — versioning',
    owner: 'smm',
    stageLabel: 'SMM QA',
    deadlineRole: 'smm',
    deadlineAt: '2026-05-14T17:00:00.000Z',
    editorPhase: 'videos',
    releasedToClientFinalVideoReview: false,
  },
  {
    id: 'v-tt-1',
    batchId: 'b-titles',
    clientId: 'c-1',
    deliverableIndex: 1,
    title: 'Video 1 — titles from editor',
    owner: 'scheduling',
    stageLabel: 'Titles prep',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'titles',
    editorPublishTitle: 'API Design: The Tradeoff Nobody Explains',
  },
  {
    id: 'v-tt-2',
    batchId: 'b-titles',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'Video 2 — titles from editor',
    owner: 'scheduling',
    stageLabel: 'Titles prep',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'titles',
    editorPublishTitle: 'REST vs GraphQL in 45 seconds',
  },
  {
    id: 'v-tt-3',
    batchId: 'b-titles',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'Video 3 — titles from editor',
    owner: 'scheduling',
    stageLabel: 'Titles prep',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'titles',
    editorPublishTitle: 'Auth flows that do not get you paged',
  },
  {
    id: 'v-tt-4',
    batchId: 'b-titles',
    clientId: 'c-1',
    deliverableIndex: 4,
    title: 'Video 4 — titles from editor',
    owner: 'scheduling',
    stageLabel: 'Titles prep',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'titles',
    editorPublishTitle: 'Rate limits explained without the doom loop',
  },
  {
    id: 'v-of-1',
    batchId: 'b-obs-final',
    clientId: 'c-1',
    deliverableIndex: 1,
    title: 'Beat 1 — cold open',
    owner: 'client',
    stageLabel: 'Final video review',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'videos',
    releasedToClientFinalVideoReview: true,
  },
  {
    id: 'v-of-2',
    batchId: 'b-obs-final',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'Beat 2 — product beat',
    owner: 'client',
    stageLabel: 'Final video review',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'videos',
    releasedToClientFinalVideoReview: true,
  },
  {
    id: 'v-of-3',
    batchId: 'b-obs-final',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'Beat 3 — CTA',
    owner: 'scheduling',
    stageLabel: 'Approved — client final',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'handed_off',
    releasedToClientFinalVideoReview: false,
  },
  {
    id: 'v-of-4',
    batchId: 'b-obs-final',
    clientId: 'c-1',
    deliverableIndex: 4,
    title: 'Beat 4 — outro',
    owner: 'scheduling',
    stageLabel: 'Approved — client final',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'handed_off',
    releasedToClientFinalVideoReview: false,
  },
  {
    id: 'v-ot-1',
    batchId: 'b-obs-thumb',
    clientId: 'c-1',
    deliverableIndex: 1,
    title: 'Video 1 — thumb round',
    owner: 'client',
    stageLabel: 'Thumbnail review',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'thumbnails',
    releasedToClientFinalVideoReview: true,
  },
  {
    id: 'v-ot-2',
    batchId: 'b-obs-thumb',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'Video 2 — thumb round',
    owner: 'client',
    stageLabel: 'Thumbnail review',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'thumbnails',
    releasedToClientFinalVideoReview: true,
  },
  {
    id: 'v-ot-3',
    batchId: 'b-obs-thumb',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'Video 3 — thumb round',
    owner: 'editor',
    stageLabel: 'Thumbnails in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-15T18:00:00.000Z',
    editorPhase: 'thumbnails',
  },
  {
    id: 'v-ot-4',
    batchId: 'b-obs-thumb',
    clientId: 'c-1',
    deliverableIndex: 4,
    title: 'Video 4 — thumb round',
    owner: 'editor',
    stageLabel: 'Thumbnails in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-15T18:00:00.000Z',
    editorPhase: 'thumbnails',
  },
  {
    id: 'v-oe-1',
    batchId: 'b-obs-edit',
    clientId: 'c-1',
    deliverableIndex: 1,
    title: 'B-roll 1 — skyline',
    owner: 'editor',
    stageLabel: 'Videos in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-16T18:00:00.000Z',
    editorPhase: 'videos',
  },
  {
    id: 'v-oe-2',
    batchId: 'b-obs-edit',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'B-roll 2 — hands',
    owner: 'editor',
    stageLabel: 'Videos in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-16T18:00:00.000Z',
    editorPhase: 'videos',
  },
  {
    id: 'v-oe-3',
    batchId: 'b-obs-edit',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'B-roll 3 — workshop',
    owner: 'editor',
    stageLabel: 'Videos in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-16T18:00:00.000Z',
    editorPhase: 'videos',
  },
  {
    id: 'v-oe-4',
    batchId: 'b-obs-edit',
    clientId: 'c-1',
    deliverableIndex: 4,
    title: 'B-roll 4 — laptop',
    owner: 'editor',
    stageLabel: 'Videos in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-16T18:00:00.000Z',
    editorPhase: 'videos',
  },
]

export function guidelinesSourceLabel(source: BrandGuidelinesSource): string {
  switch (source) {
    case 'google_doc':
      return 'Google Doc'
    case 'client':
      return 'Client-provided'
    case 'internal':
      return 'Scale Brands Lab'
  }
}

export const ADMIN_KANBAN_COLUMNS: {
  owner: VideoPipelineOwner
  label: string
}[] = [
  { owner: 'client', label: 'With client' },
  { owner: 'smm', label: 'With SMM' },
  { owner: 'editor', label: 'With editor' },
  { owner: 'scheduling', label: 'Scheduling' },
  { owner: 'done', label: 'Done' },
]
