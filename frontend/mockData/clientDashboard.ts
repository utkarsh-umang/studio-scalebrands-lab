/**
 * Prototype-only client dashboard payload.
 * Wire to API later; keep shapes close to eventual domain models.
 */

export type ClientAttentionKind =
  | 'clip_review'
  | 'idea_review'
  | 'text_review'
  | 'final_video_review'

export type ClientBatchRow = {
  id: string
  title: string
  /** Pipeline stage shown to the client */
  stageLabel: string
  attention?: ClientAttentionKind
  /** ISO date string */
  updatedAt: string
}

export type ScheduledVideoRow = {
  id: string
  title: string
  platform: string
  /** ISO date string */
  goLiveAt: string
  link?: string
}

export type FinalReviewMock = {
  batchId: string
  batchTitle: string
  /** Public sample — replace with deliverable URL from API */
  videoSrc: string
  thumbnailAlt: string
}

export type ClientDashboardMock = {
  creditsRemaining: number
  needsAttention: ClientBatchRow[]
  inProgress: ClientBatchRow[]
  scheduled: ScheduledVideoRow[]
}

export const MOCK_CLIENT_DASHBOARD: ClientDashboardMock = {
  creditsRemaining: 42,
  needsAttention: [
    {
      id: 'b-204',
      title: 'Q2 product clips',
      stageLabel: 'Clip approval',
      attention: 'clip_review',
      updatedAt: '2026-04-28',
    },
    {
      id: 'b-198',
      title: 'Founder story — batch 2',
      stageLabel: 'Final video review',
      attention: 'final_video_review',
      updatedAt: '2026-04-30',
    },
  ],
  inProgress: [
    {
      id: 'b-201',
      title: 'Spring launch teasers',
      stageLabel: 'Editing',
      updatedAt: '2026-04-29',
    },
    {
      id: 'b-196',
      title: 'Weekly Shorts — April',
      stageLabel: 'SMM QA',
      updatedAt: '2026-04-27',
    },
  ],
  scheduled: [
    {
      id: 's-12',
      title: 'Brand anthem — 15s',
      platform: 'YouTube Shorts',
      goLiveAt: '2026-05-05T17:00:00.000Z',
      link: 'https://www.youtube.com/shorts/example',
    },
    {
      id: 's-11',
      title: 'Customer story — Carla',
      platform: 'Instagram Reels',
      goLiveAt: '2026-05-08T14:30:00.000Z',
    },
  ],
}

/** List rows for /client/batches */
export type ClipBatchListRow = {
  id: string
  title: string
  updatedAt: string
  subtitle: string
}

export type MockClip = { id: string; title: string }

export type ClipBatchDetail = {
  id: string
  title: string
  footageUrl: string
  footageLabel: string
  updatedAt: string
  clips: MockClip[]
}

export const MOCK_CLIENT_CLIP_BATCH_INDEX: ClipBatchListRow[] = [
  {
    id: 'b-204',
    title: 'Q2 product clips',
    subtitle: 'Raw footage received · clip ideas ready',
    updatedAt: '2026-04-28',
  },
]

export const MOCK_CLIP_BATCHES: Record<string, ClipBatchDetail> = {
  'b-204': {
    id: 'b-204',
    title: 'Q2 product clips',
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

export type IdeaBatchListRow = {
  id: string
  title: string
  updatedAt: string
  subtitle: string
}

export type IdeaBatchDetail = {
  id: string
  title: string
  updatedAt: string
  ideas: { id: string; title: string }[]
}

export const MOCK_CLIENT_IDEA_BATCH_INDEX: IdeaBatchListRow[] = [
  {
    id: 'b-207',
    title: 'Summer campaign — hooks',
    subtitle: 'SMM researched 6 ideas · awaiting your pick',
    updatedAt: '2026-04-29',
  },
]

export const MOCK_IDEA_BATCHES: Record<string, IdeaBatchDetail> = {
  'b-207': {
    id: 'b-207',
    title: 'Summer campaign — hooks',
    updatedAt: '2026-04-29',
    ideas: [
      { id: 'i1', title: 'The metric we almost ignored that doubled retention' },
      { id: 'i2', title: 'Why “fast shipping” is hurting your roadmap' },
      { id: 'i3', title: '3 questions every exec asks in the first meeting' },
      { id: 'i4', title: 'We killed a flagship feature — here is what happened' },
    ],
  },
}

export type TextBatchListRow = {
  id: string
  title: string
  updatedAt: string
  subtitle: string
}

export type TextBatchDetail = {
  id: string
  title: string
  updatedAt: string
  thumbnailText: string
  videoTitle: string
}

export const MOCK_CLIENT_TEXT_BATCH_INDEX: TextBatchListRow[] = [
  {
    id: 'b-209',
    title: 'Redis deep dive clip',
    subtitle: 'Thumbnail + title copy from SMM',
    updatedAt: '2026-04-26',
  },
]

export const MOCK_TEXT_BATCHES: Record<string, TextBatchDetail> = {
  'b-209': {
    id: 'b-209',
    title: 'Redis deep dive clip',
    updatedAt: '2026-04-26',
    thumbnailText: 'Why Redis Feels Instant',
    videoTitle: 'Redis Deep Dive: Speed Secrets Most Devs Miss',
  },
}

export type FinalReviewListRow = {
  batchId: string
  title: string
  updatedAt: string
  subtitle: string
}

export const MOCK_CLIENT_FINAL_REVIEW_INDEX: FinalReviewListRow[] = [
  {
    batchId: 'b-198',
    title: 'Founder story — batch 2',
    subtitle: 'Deliverable ready · YouTube Shorts',
    updatedAt: '2026-04-30',
  },
]

export const MOCK_FINAL_REVIEWS: Record<string, FinalReviewMock> = {
  'b-198': {
    batchId: 'b-198',
    batchTitle: 'Founder story — batch 2',
    videoSrc:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    thumbnailAlt: 'Video thumbnail preview',
  },
}
