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
      id: 'b-204',
      title: 'Q2 product clips',
      clientName: 'TechWithTim',
      stageLabel: 'Clip identification',
      attention: 'clip_identification',
      updatedAt: '2026-04-28',
      deadline: '2026-05-01',
    },
    {
      id: 'qa-211',
      title: 'Launch week — hero cut',
      clientName: 'Northwind Media',
      stageLabel: 'SMM QA',
      attention: 'smm_qa',
      updatedAt: '2026-04-30',
    },
    {
      id: 'b-215',
      title: 'Customer montage — May',
      clientName: 'TechWithTim',
      stageLabel: 'Scheduling',
      attention: 'scheduling',
      updatedAt: '2026-05-01',
    },
  ],
  withClient: [
    {
      id: 'b-207',
      title: 'Summer campaign — hooks',
      clientName: 'Northwind Media',
      stageLabel: 'Ideas review (client)',
      updatedAt: '2026-04-29',
    },
    {
      id: 'b-209',
      title: 'Redis deep dive clip',
      clientName: 'TechWithTim',
      stageLabel: 'Titles review (client)',
      updatedAt: '2026-04-26',
    },
  ],
  withEditor: [
    {
      id: 'b-201',
      title: 'Spring launch teasers',
      clientName: 'TechWithTim',
      stageLabel: 'Editing',
      updatedAt: '2026-04-29',
      deadline: '2026-05-03',
    },
    {
      id: 'b-208',
      title: 'Podcast highlights — ep. 42',
      clientName: 'Northwind Media',
      stageLabel: 'Resolving QA flags',
      updatedAt: '2026-04-27',
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
    id: 'b-204',
    title: 'Q2 product clips',
    clientName: 'TechWithTim',
    subtitle: 'Raw footage link received · identify clips to send',
    updatedAt: '2026-04-28',
  },
]

export const MOCK_SMM_CLIP_BATCHES: Record<string, SmmClipBatchDetail> = {
  'b-204': {
    id: 'b-204',
    title: 'Q2 product clips',
    clientName: 'TechWithTim',
    footageUrl: 'https://example.com/footage',
    footageLabel: 'Product walkthrough — Apr 28 upload',
    updatedAt: '2026-04-28',
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
    taskId: 'qa-211',
    batchTitle: 'Launch week — hero cut',
    clientName: 'Northwind Media',
    subtitle: 'Editor submitted deliverable · your review',
    updatedAt: '2026-04-30',
  },
  {
    taskId: 'qa-198',
    batchTitle: 'Founder story — batch 2',
    clientName: 'TechWithTim',
    subtitle: 'Re-submitted after QA fixes',
    updatedAt: '2026-04-29',
  },
]

export const MOCK_SMM_QA_TASKS: Record<string, SmmQaDetail> = {
  'qa-211': {
    taskId: 'qa-211',
    batchTitle: 'Launch week — hero cut',
    clientName: 'Northwind Media',
    updatedAt: '2026-04-30',
    videoSrc:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    thumbnailAlt: 'Hero cut thumbnail',
    existingFlags: [],
  },
  'qa-198': {
    taskId: 'qa-198',
    batchTitle: 'Founder story — batch 2',
    clientName: 'TechWithTim',
    updatedAt: '2026-04-29',
    videoSrc:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    thumbnailAlt: 'Founder story thumbnail',
    existingFlags: [
      { id: 'f1', atSeconds: 12, note: 'Logo bump feels 0.5s late' },
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

export const MOCK_SMM_SCHEDULE_INDEX: SmmScheduleListRow[] = [
  {
    batchId: 'b-215',
    title: 'Customer montage — May',
    clientName: 'TechWithTim',
    subtitle: 'Client approved final · set go-live + deduct credits',
    updatedAt: '2026-05-01',
    creditCost: 1,
  },
]

export const MOCK_SMM_SCHEDULE_DETAILS: Record<string, SmmScheduleDetail> = {
  'b-215': {
    batchId: 'b-215',
    title: 'Customer montage — May',
    clientName: 'TechWithTim',
    updatedAt: '2026-05-01',
    creditCost: 1,
    suggestedPlatform: 'YouTube Shorts',
  },
}
