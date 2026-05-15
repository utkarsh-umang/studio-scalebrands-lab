/**
 * Prototype payloads for client card detail drawers.
 */

export type ClipRecommendation = 'produce' | 'skip'

export type ClientClipCandidate = {
  id: string
  number: number
  title: string
  description: string
  recommendation: ClipRecommendation
}

export type ClientClipReviewDetail = {
  batchId: string
  videoId: string
  clipsFolderUrl: string
  sourceMediaUrl?: string
  clips: ClientClipCandidate[]
}

export type ClipOption = { id: string; title: string }

export type ClientIdeaReviewDetail = {
  videoId: string
  ideas: ClipOption[]
}

export type ClientTextReviewDetail = {
  videoId: string
  thumbnailText: string
  videoTitle: string
}

export type ClientFinalReviewDetail = {
  videoId: string
  videoSrc: string
  thumbnailAlt: string
}

const CLIP_REVIEWS_BY_BATCH: Record<string, ClientClipReviewDetail> = {
  'b-yet': {
    batchId: 'b-yet',
    videoId: 'v-clip-gate',
    clipsFolderUrl: 'https://drive.google.com/drive/folders/example-q2-clips',
    sourceMediaUrl: 'https://www.youtube.com/watch?v=example-techwithtim-may-podcast',
    clips: [
      {
        id: 'c1',
        number: 1,
        title: 'Why our onboarding beats the industry average',
        description:
          'Strong hook in the first 3s. Recommended to produce as a Short — aligns with Q2 onboarding push.',
        recommendation: 'produce',
      },
      {
        id: 'c2',
        number: 2,
        title: 'The one feature teams enable first',
        description:
          'Good B-roll but audio dip at 0:42. Worth producing if you can accept a light edit on levels.',
        recommendation: 'produce',
      },
      {
        id: 'c3',
        number: 3,
        title: 'Security checklist in 60 seconds',
        description:
          'Overlaps with clip 1 messaging. SMM suggests skipping unless you want a security-only variant.',
        recommendation: 'skip',
      },
    ],
  },
}

const IDEA_REVIEWS: Record<string, ClientIdeaReviewDetail> = {}

const TEXT_REVIEWS: Record<string, ClientTextReviewDetail> = {}

const SAMPLE_VIDEO_SRC =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm'

const FINAL_REVIEWS: Record<string, ClientFinalReviewDetail> = {
  'v-of-1': {
    videoId: 'v-of-1',
    videoSrc: SAMPLE_VIDEO_SRC,
    thumbnailAlt: 'Spring set — beat 1 preview',
  },
  'v-of-2': {
    videoId: 'v-of-2',
    videoSrc: SAMPLE_VIDEO_SRC,
    thumbnailAlt: 'Spring set — beat 2 preview',
  },
}

export { SAMPLE_VIDEO_SRC }

export function getClientClipReview(
  videoId: string,
  batchId?: string,
): ClientClipReviewDetail | undefined {
  if (batchId && CLIP_REVIEWS_BY_BATCH[batchId]) {
    return CLIP_REVIEWS_BY_BATCH[batchId]
  }
  return Object.values(CLIP_REVIEWS_BY_BATCH).find((r) => r.videoId === videoId)
}

export function getClientIdeaReview(videoId: string): ClientIdeaReviewDetail | undefined {
  return IDEA_REVIEWS[videoId]
}

export function getClientTextReview(videoId: string): ClientTextReviewDetail | undefined {
  return TEXT_REVIEWS[videoId]
}

export function getClientFinalReview(
  videoId: string,
): ClientFinalReviewDetail | undefined {
  return FINAL_REVIEWS[videoId]
}
