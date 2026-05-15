/**
 * Prototype-only SMM dashboard payload.
 * Wire to API later; keep shapes close to eventual domain models.
 */

export type SmmAttentionKind =
  | 'clip_identification'
  | 'idea_research'
  | 'text_creation'
  | 'smm_qa'
  | 'scheduling'

export type SmmBatchRow = {
  id: string
  title: string
  clientName: string
  /** Pipeline stage label shown in lists */
  stageLabel: string
  attention?: SmmAttentionKind
  /** ISO date string */
  updatedAt: string
  /** ISO date (day) when Admin set a deadline */
  deadline?: string
}

export type SmmDashboardMock = {
  needsAttention: SmmBatchRow[]
  /** Batches where the next action is the client */
  withClient: SmmBatchRow[]
  /** Batches where the next action is the Editor */
  withEditor: SmmBatchRow[]
}

export const MOCK_SMM_DASHBOARD: SmmDashboardMock = {
  needsAttention: [
    {
      id: 'b-yet',
      title: 'June podcast — yet to start',
      clientName: 'TechWithTim',
      stageLabel: 'Find clips + clips Drive link',
      attention: 'clip_identification',
      updatedAt: '2026-05-15',
      deadline: '2026-05-18',
    },
    {
      id: 'b-smm-qa',
      title: 'Q2 cuts — SMM video QA',
      clientName: 'TechWithTim',
      stageLabel: 'SMM QA',
      attention: 'smm_qa',
      updatedAt: '2026-05-14',
    },
    {
      id: 'b-titles',
      title: 'Product drop — editor titles in Drive',
      clientName: 'TechWithTim',
      stageLabel: 'Titles prep',
      attention: 'scheduling',
      updatedAt: '2026-05-14',
    },
  ],
  withClient: [
    {
      id: 'b-obs-final',
      title: 'Spring set — client on final video QA',
      clientName: 'TechWithTim',
      stageLabel: 'Final video review',
      updatedAt: '2026-05-14',
    },
    {
      id: 'b-obs-thumb',
      title: 'Campaign B — thumbnail approval window',
      clientName: 'TechWithTim',
      stageLabel: 'Thumbnail review',
      updatedAt: '2026-05-14',
    },
  ],
  withEditor: [
    {
      id: 'b-obs-edit',
      title: 'B-roll pack — with editor (clips approved)',
      clientName: 'TechWithTim',
      stageLabel: 'Videos in progress',
      updatedAt: '2026-05-14',
      deadline: '2026-05-16',
    },
  ],
}

/** Find clips — list */
export type SmmClipBatchListRow = {
  id: string
  title: string
  clientName: string
  updatedAt: string
  subtitle: string
}

export type SmmClipProposed = { id: string; title: string }

export type SmmClipBatchDetail = {
  id: string
  title: string
  clientName: string
  footageUrl: string
  footageLabel: string
  updatedAt: string
  clips: SmmClipProposed[]
}

export const MOCK_SMM_CLIP_BATCH_INDEX: SmmClipBatchListRow[] = [
  {
    id: 'b-yet',
    title: 'June podcast — yet to start',
    clientName: 'TechWithTim',
    subtitle: 'Raw footage link received · identify clips + add Drive folder',
    updatedAt: '2026-05-15',
  },
]

export const MOCK_SMM_CLIP_BATCHES: Record<string, SmmClipBatchDetail> = {
  'b-yet': {
    id: 'b-yet',
    title: 'June podcast — yet to start',
    clientName: 'TechWithTim',
    footageUrl: 'https://www.youtube.com/watch?v=example-techwithtim-may-podcast',
    footageLabel: 'Engineering podcast — May upload',
    updatedAt: '2026-05-15',
    clips: [
      {
        id: 'c1',
        title: 'Why our onboarding beats the industry average',
      },
      {
        id: 'c2',
        title: 'The one feature teams enable first',
      },
      {
        id: 'c3',
        title: 'Security checklist in 60 seconds',
      },
    ],
  },
}

/** Idea research */
export type SmmIdeaBatchListRow = {
  id: string
  title: string
  clientName: string
  updatedAt: string
  subtitle: string
}

export type SmmIdeaBatchDetail = {
  id: string
  title: string
  clientName: string
  updatedAt: string
  ideas: { id: string; title: string }[]
}

export const MOCK_SMM_IDEA_BATCH_INDEX: SmmIdeaBatchListRow[] = [
  {
    id: 'b-212',
    title: 'Evergreen tips — batch 4',
    clientName: 'Northwind Media',
    subtitle: 'Client requested fresh ideas',
    updatedAt: '2026-04-30',
  },
]

export const MOCK_SMM_IDEA_BATCHES: Record<string, SmmIdeaBatchDetail> = {
  'b-212': {
    id: 'b-212',
    title: 'Evergreen tips — batch 4',
    clientName: 'Northwind Media',
    updatedAt: '2026-04-30',
    ideas: [
      { id: 'i1', title: 'The metric we almost ignored that doubled retention' },
      { id: 'i2', title: 'Why “fast shipping” is hurting your roadmap' },
      { id: 'i3', title: '3 questions every exec asks in the first meeting' },
    ],
  },
}

/** Text creation */
export type SmmTextBatchListRow = {
  id: string
  title: string
  clientName: string
  updatedAt: string
  subtitle: string
}

export type SmmTextBatchDetail = {
  id: string
  title: string
  clientName: string
  updatedAt: string
  thumbnailText: string
  videoTitle: string
}

export const MOCK_SMM_TEXT_BATCH_INDEX: SmmTextBatchListRow[] = [
  {
    id: 'b-213',
    title: 'API design — Shorts cut',
    clientName: 'TechWithTim',
    subtitle: 'Clips approved · write thumbnail + video title',
    updatedAt: '2026-04-29',
  },
]

export const MOCK_SMM_TEXT_BATCHES: Record<string, SmmTextBatchDetail> = {
  'b-213': {
    id: 'b-213',
    title: 'API design — Shorts cut',
    clientName: 'TechWithTim',
    updatedAt: '2026-04-29',
    thumbnailText: 'REST vs GraphQL in 45s',
    videoTitle: 'API Design: The Tradeoff Nobody Explains',
  },
}

/** Video QA */
export type SmmQaListRow = {
  taskId: string
  batchTitle: string
  clientName: string
  updatedAt: string
  subtitle: string
}

export type SmmQaFlagDraft = {
  id: string
  atSeconds: number
  note: string
}

export type SmmQaDetail = {
  taskId: string
  batchTitle: string
  clientName: string
  updatedAt: string
  videoSrc: string
  thumbnailAlt: string
  /** Existing flags from a prior pass (mock) */
  existingFlags: SmmQaFlagDraft[]
}

export const MOCK_SMM_QA_INDEX: SmmQaListRow[] = [
  {
    taskId: 'v-sq-1',
    batchTitle: 'Q2 cuts — SMM video QA',
    clientName: 'TechWithTim',
    subtitle: 'Deliverable 1 · editor submitted to Drive',
    updatedAt: '2026-05-14',
  },
  {
    taskId: 'v-sq-2',
    batchTitle: 'Q2 cuts — SMM video QA',
    clientName: 'TechWithTim',
    subtitle: 'Deliverable 2 · editor submitted to Drive',
    updatedAt: '2026-05-14',
  },
]

export const MOCK_SMM_QA_TASKS: Record<string, SmmQaDetail> = {
  'v-sq-1': {
    taskId: 'v-sq-1',
    batchTitle: 'Q2 cuts — SMM video QA',
    clientName: 'TechWithTim',
    updatedAt: '2026-05-14',
    videoSrc:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    thumbnailAlt: 'API week — deliverable 1',
    existingFlags: [],
  },
  'v-sq-2': {
    taskId: 'v-sq-2',
    batchTitle: 'Q2 cuts — SMM video QA',
    clientName: 'TechWithTim',
    updatedAt: '2026-05-14',
    videoSrc:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    thumbnailAlt: 'API week — deliverable 2',
    existingFlags: [
      { id: 'f1', atSeconds: 8, note: 'Tighten hook — first caption at 0:02' },
    ],
  },
}

/** Scheduling queue (client already approved final) */
export type SmmScheduleListRow = {
  batchId: string
  title: string
  clientName: string
  updatedAt: string
  subtitle: string
  creditCost: number
}

export type SmmScheduleDetail = {
  batchId: string
  title: string
  clientName: string
  updatedAt: string
  creditCost: number
  suggestedPlatform: string
}

export const MOCK_SMM_SCHEDULE_INDEX: SmmScheduleListRow[] = []

export const MOCK_SMM_SCHEDULE_DETAILS: Record<string, SmmScheduleDetail> = {}
