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

export const MOCK_ADMIN_BATCH_FOLDERS: AdminBatchFolder[] = [
  {
    id: 'b-204',
    clientId: 'c-1',
    batchNumber: 4,
    title: 'Q2 product clips',
    status: 'active',
    videoCount: 20,
    createdAt: '2026-04-18',
    updatedAt: '2026-04-28',
    footageUrl: 'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    intakePath: 'source_media',
    sourceMediaUrl: 'https://www.youtube.com/watch?v=example-techwithtim-podcast',
    clipsFolderUrl:
      'https://drive.google.com/drive/folders/13Dw03A1s7tLQOBm8jj5XmwzxR94AK1ut',
    clipReviewPhase: 'awaiting_client',
    creditCost: 6,
    creditsDebited: false,
    editorDeliverablesDriveUrl:
      'https://drive.google.com/drive/folders/1lnwiGh3b-UQ5PYwPvWmvpRxOcRpSjFkV',
  },
  {
    id: 'b-198',
    clientId: 'c-1',
    batchNumber: 3,
    title: 'Founder story — batch 2',
    status: 'completed',
    videoCount: 3,
    createdAt: '2026-04-02',
    updatedAt: '2026-04-30',
    completedAt: '2026-04-30',
    creditCost: 3,
    creditsDebited: true,
  },
  {
    id: 'b-201',
    clientId: 'c-2',
    batchNumber: 3,
    title: 'Spring launch teasers',
    status: 'active',
    videoCount: 4,
    createdAt: '2026-04-12',
    updatedAt: '2026-04-29',
    intakePath: 'clips_ready',
    clipsFolderUrl: 'https://drive.google.com/drive/folders/example-northwind-clips',
    clipReviewPhase: 'approved',
    creditCost: 4,
    creditsDebited: false,
    editorDeliverablesDriveUrl:
      'https://drive.google.com/drive/folders/example-northwind-deliverables',
  },
  {
    id: 'b-189',
    clientId: 'c-2',
    batchNumber: 2,
    title: 'Customer proof — series A',
    status: 'completed',
    videoCount: 2,
    createdAt: '2026-03-28',
    updatedAt: '2026-04-27',
    completedAt: '2026-04-27',
    creditCost: 2,
    creditsDebited: true,
  },
  {
    id: 'b-192',
    clientId: 'c-3',
    batchNumber: 2,
    title: 'Weekly Shorts — May',
    status: 'active',
    videoCount: 0,
    createdAt: '2026-04-20',
    updatedAt: '2026-04-30',
    creditCost: 6,
    creditsDebited: false,
  },
  {
    id: 'b-210',
    clientId: 'c-1',
    batchNumber: 5,
    title: 'May shorts — new folder',
    status: 'active',
    videoCount: 0,
    createdAt: '2026-05-01',
    updatedAt: '2026-05-01',
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
    id: 'b-175',
    clientId: 'c-1',
    batchNumber: 2,
    title: 'Launch day cutdowns',
    status: 'completed',
    videoCount: 8,
    createdAt: '2026-02-01',
    updatedAt: '2026-03-15',
    completedAt: '2026-03-15',
    creditCost: 8,
    creditsDebited: true,
  },
  {
    id: 'b-160',
    clientId: 'c-2',
    batchNumber: 1,
    title: 'January evergreen pack',
    status: 'completed',
    videoCount: 10,
    createdAt: '2026-01-08',
    updatedAt: '2026-02-20',
    completedAt: '2026-02-20',
    creditCost: 10,
    creditsDebited: true,
  },
  {
    id: 'b-155',
    clientId: 'c-3',
    batchNumber: 1,
    title: 'Brand intro reels',
    status: 'completed',
    videoCount: 4,
    createdAt: '2026-03-01',
    updatedAt: '2026-03-28',
    completedAt: '2026-03-28',
    creditCost: 4,
    creditsDebited: true,
  },
]

export const MOCK_ADMIN_VIDEO_TICKETS: AdminVideoTicket[] = [
  {
    id: 'v-1',
    batchId: 'b-204',
    clientId: 'c-1',
    title: 'Clip approval',
    owner: 'client',
    stageLabel: 'Clip review',
    deadlineRole: null,
    deadlineAt: null,
  },
  {
    id: 'v-2',
    batchId: 'b-204',
    clientId: 'c-1',
    deliverableIndex: 2,
    title: 'Clip 2 — Debugging tip',
    owner: 'smm',
    stageLabel: 'Clip identification',
    deadlineRole: 'smm',
    deadlineAt: '2026-05-08T17:00:00.000Z',
  },
  {
    id: 'v-3',
    batchId: 'b-204',
    clientId: 'c-1',
    deliverableIndex: 3,
    title: 'Clip 3 — Tool comparison',
    owner: 'smm',
    stageLabel: 'SMM QA',
    deadlineRole: 'smm',
    deadlineAt: '2026-05-10T12:00:00.000Z',
    editorPhase: 'videos',
  },
  {
    id: 'v-4',
    batchId: 'b-204',
    clientId: 'c-1',
    deliverableIndex: 4,
    title: 'Clip 4 — Q&A short',
    owner: 'client',
    stageLabel: 'Final video review',
    deadlineRole: null,
    deadlineAt: null,
  },
  {
    id: 'v-5',
    batchId: 'b-204',
    clientId: 'c-1',
    deliverableIndex: 5,
    title: 'Clip 5 — Outro CTA',
    owner: 'scheduling',
    stageLabel: 'Scheduling',
    deadlineRole: null,
    deadlineAt: null,
  },
  {
    id: 'v-6',
    batchId: 'b-201',
    clientId: 'c-2',
    title: 'Teaser A',
    owner: 'client',
    stageLabel: 'Text review',
    deadlineRole: null,
    deadlineAt: null,
  },
  {
    id: 'v-7',
    batchId: 'b-201',
    clientId: 'c-2',
    title: 'Teaser B',
    owner: 'editor',
    stageLabel: 'Thumbnails in progress',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-06T18:00:00.000Z',
    editorPhase: 'thumbnails',
  },
  {
    id: 'v-11',
    batchId: 'b-201',
    clientId: 'c-2',
    title: 'Teaser D — feature walkthrough',
    owner: 'client',
    stageLabel: 'Thumbnail review',
    deadlineRole: null,
    deadlineAt: null,
    editorPhase: 'thumbnails',
  },
  {
    id: 'v-10',
    batchId: 'b-201',
    clientId: 'c-2',
    title: 'Teaser C — hero hook',
    owner: 'editor',
    stageLabel: 'Video titles',
    deadlineRole: 'editor',
    deadlineAt: '2026-05-07T14:00:00.000Z',
    editorPhase: 'titles',
  },
  {
    id: 'v-8',
    batchId: 'b-192',
    clientId: 'c-3',
    title: 'Short 1 — Product demo',
    owner: 'smm',
    stageLabel: 'Text creation',
    deadlineRole: 'smm',
    deadlineAt: null,
  },
  {
    id: 'v-9',
    batchId: 'b-192',
    clientId: 'c-3',
    title: 'Short 2 — Testimonial',
    owner: 'client',
    stageLabel: 'Final video review',
    deadlineRole: null,
    deadlineAt: null,
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
