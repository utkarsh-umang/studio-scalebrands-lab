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

/**
 * Five active batches — one per major pipeline stage — plus one completed archive.
 *
 * b-new      : batch created, client hasn't submitted their source link yet
 * b-clips    : clips uploaded by SMM, client needs to approve them
 * b-editing  : clips approved, editor working on videos (no deliverables folder yet)
 * b-pipeline : deliverables folder shared; 5 videos spanning every mid-pipeline stage
 * b-schedule : all videos approved and titled, SMM ready to schedule
 * b-archive  : completed cycle
 */
export const MOCK_ADMIN_BATCH_FOLDERS: AdminBatchFolder[] = [
  {
    id: 'b-new',
    clientId: 'c-1',
    batchNumber: 19,
    title: 'July Deep Dive',
    status: 'active',
    videoCount: 0,
    createdAt: '2026-05-16',
    updatedAt: '2026-05-16',
    intakePath: 'source_media',
    creditCost: 5,
    creditsDebited: false,
  },
  {
    id: 'b-clips',
    clientId: 'c-1',
    batchNumber: 20,
    title: 'June Podcast',
    status: 'active',
    videoCount: 0,
    createdAt: '2026-05-15',
    updatedAt: '2026-05-15',
    intakePath: 'source_media',
    sourceMediaUrl: 'https://www.youtube.com/watch?v=example-techwithtim-june-podcast',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'awaiting_client',
    creditCost: 5,
    creditsDebited: false,
  },
  {
    id: 'b-editing',
    clientId: 'c-1',
    batchNumber: 21,
    title: 'April B-Roll Pack',
    status: 'active',
    videoCount: 3,
    createdAt: '2026-05-11',
    updatedAt: '2026-05-14',
    intakePath: 'source_media',
    sourceMediaUrl: 'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'approved',
    creditCost: 3,
    creditsDebited: false,
  },
  {
    id: 'b-pipeline',
    clientId: 'c-1',
    batchNumber: 22,
    title: 'Q2 Tech Breakdown',
    status: 'active',
    videoCount: 5,
    createdAt: '2026-05-08',
    updatedAt: '2026-05-14',
    intakePath: 'source_media',
    sourceMediaUrl: 'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'approved',
    creditCost: 5,
    creditsDebited: false,
    editorDeliverablesDriveUrl: DRIVE_EDITOR_ROOT,
  },
  {
    id: 'b-schedule',
    clientId: 'c-1',
    batchNumber: 23,
    title: 'Product Launch Series',
    status: 'active',
    videoCount: 3,
    createdAt: '2026-05-09',
    updatedAt: '2026-05-14',
    intakePath: 'source_media',
    sourceMediaUrl: 'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    clipsFolderUrl: DRIVE_CLIPS,
    clipReviewPhase: 'approved',
    creditCost: 3,
    creditsDebited: false,
    editorDeliverablesDriveUrl: DRIVE_EDITOR_ROOT,
  },
  {
    id: 'b-archive',
    clientId: 'c-1',
    batchNumber: 9,
    title: 'March Compilation',
    status: 'completed',
    videoCount: 4,
    createdAt: '2026-03-01',
    updatedAt: '2026-04-01',
    completedAt: '2026-04-01',
    creditCost: 4,
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

export const MOCK_ADMIN_VIDEO_TICKETS: AdminVideoTicket[] = [
  // b-archive — completed
  doneTicket('v-arch-1', 'b-archive', 'c-1', 'Build in Public — ep. 1', 1),
  doneTicket('v-arch-2', 'b-archive', 'c-1', 'Build in Public — ep. 2', 2),
  doneTicket('v-arch-3', 'b-archive', 'c-1', 'Build in Public — ep. 3', 3),
  doneTicket('v-arch-4', 'b-archive', 'c-1', 'Build in Public — ep. 4', 4),

  // b-editing — editor working on videos, no deliverables folder yet
  {
    id: 'v-ed-1',
    batchId: 'b-editing',
    clientId: 'c-1',
    deliverableIndex: 1,
    title: 'B-Roll 1 — skyline',
    owner: 'editor',
    stageLabel: 'Videos in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-18T18:00:00.000Z',
    editorPhase: 'videos',
  },
  {
    id: 'v-ed-2',
    batchId: 'b-editing',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'B-Roll 2 — hands on keyboard',
    owner: 'editor',
    stageLabel: 'Videos in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-18T18:00:00.000Z',
    editorPhase: 'videos',
  },
  {
    id: 'v-ed-3',
    batchId: 'b-editing',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'B-Roll 3 — workshop',
    owner: 'editor',
    stageLabel: 'Videos in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-18T18:00:00.000Z',
    editorPhase: 'videos',
  },

  // b-pipeline — 5 videos spanning every mid-pipeline stage simultaneously
  {
    id: 'v-p-1',
    batchId: 'b-pipeline',
    clientId: 'c-1',
    deliverableIndex: 1,
    title: 'REST vs GraphQL',
    owner: 'smm',
    stageLabel: 'SMM QA',
    deadlineRole: 'smm',
    deadlineAt: '2026-05-16T17:00:00.000Z',
    editorPhase: 'videos',
    releasedToClientFinalVideoReview: false,
  },
  {
    id: 'v-p-2',
    batchId: 'b-pipeline',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'Auth deep dive',
    owner: 'editor',
    stageLabel: 'QA flagged',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-16T18:00:00.000Z',
    editorPhase: 'videos',
    lastRevisionRequestedBy: 'smm',
    releasedToClientFinalVideoReview: false,
    qaCommentHistory: [
      {
        id: 'qc-p-2a',
        slot: 'video',
        assetVersion: 1,
        kind: 'general',
        authorRole: 'smm',
        body: 'Tighten the cold open — brand sting feels late by two beats.',
        createdAt: '2026-05-15T11:00:00.000Z',
        deprecated: false,
      },
    ],
  },
  {
    id: 'v-p-3',
    batchId: 'b-pipeline',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'Rate limits explained',
    owner: 'client',
    stageLabel: 'Final video review',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'videos',
    releasedToClientFinalVideoReview: true,
  },
  {
    id: 'v-p-4',
    batchId: 'b-pipeline',
    clientId: 'c-1',
    deliverableIndex: 4,
    title: 'API versioning patterns',
    owner: 'client',
    stageLabel: 'Thumbnail review',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'thumbnails',
    releasedToClientFinalVideoReview: true,
  },
  {
    id: 'v-p-5',
    batchId: 'b-pipeline',
    clientId: 'c-1',
    deliverableIndex: 5,
    title: 'WebSockets vs polling',
    owner: 'editor',
    stageLabel: 'Video titles',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-17T18:00:00.000Z',
    editorPhase: 'titles',
    releasedToClientFinalVideoReview: true,
  },

  // b-schedule — all approved and titled, SMM ready to schedule
  {
    id: 'v-sc-1',
    batchId: 'b-schedule',
    clientId: 'c-1',
    deliverableIndex: 1,
    title: 'Product launch teaser',
    owner: 'scheduling',
    stageLabel: 'Titles prep',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'titles',
    editorPublishTitle: 'We built something. Here is what it does.',
    releasedToClientFinalVideoReview: true,
  },
  {
    id: 'v-sc-2',
    batchId: 'b-schedule',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'Feature walkthrough',
    owner: 'scheduling',
    stageLabel: 'Titles prep',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'titles',
    editorPublishTitle: 'The one feature that saves you an hour a day',
    releasedToClientFinalVideoReview: true,
  },
  {
    id: 'v-sc-3',
    batchId: 'b-schedule',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'Customer story',
    owner: 'scheduling',
    stageLabel: 'Titles prep',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'titles',
    editorPublishTitle: 'How one team cut review time by 60%',
    releasedToClientFinalVideoReview: true,
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
