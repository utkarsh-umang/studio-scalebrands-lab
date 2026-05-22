/**
 * Path B demo catalog — ties UI spec stages to mock batch/video ids.
 * See context/path-b-ui-spec.md §10.
 */

export type PathBDemoStage =
  | 'intake_pending'
  | 'clips_identifying'
  | 'clip_client_review'
  | 'clips_ready_intake'
  | 'pre_split_production'
  | 'production'
  | 'smm_qa'
  | 'editor_fix'
  | 'client_qa'
  | 'revision_via_smm'
  | 'scheduling'
  | 'completed'

export type PathBDemoScenario = {
  stage: PathBDemoStage
  batchId: string
  batchTitle: string
  clientId: string
  /** What you should see on the client board */
  clientBoardExpectation: string
  /** Primary video ticket ids (empty = no cards / gate only) */
  videoTicketIds: string[]
  /** Login hint */
  loginHint: string
}

/** Primary demo client — use client@scalebrandslab.demo */
export const PATH_B_DEMO_CLIENT_ID = 'c-1'

export const PATH_B_DEMO_SCENARIOS: PathBDemoScenario[] = [
  {
    stage: 'intake_pending',
    batchId: 'b-new',
    batchTitle: 'July Deep Dive',
    clientId: PATH_B_DEMO_CLIENT_ID,
    clientBoardExpectation:
      'Intake card only (podcast vs clips-ready). No kanban cards.',
    videoTicketIds: [],
    loginHint: 'client@scalebrandslab.demo',
  },
  {
    stage: 'clips_identifying',
    batchId: 'b-identifying',
    batchTitle: 'May Podcast — identifying',
    clientId: PATH_B_DEMO_CLIENT_ID,
    clientBoardExpectation:
      'In progress: one card “Team is identifying your clips” → status modal (source link). If clips folder exists: read-only preview + banner.',
    videoTicketIds: ['v-identifying-gate'],
    loginHint: 'SMM/Editor: upload clips folder on b-identifying',
  },
  {
    stage: 'clip_client_review',
    batchId: 'b-clips',
    batchTitle: 'June Podcast',
    clientId: PATH_B_DEMO_CLIENT_ID,
    clientBoardExpectation:
      'Single card “Clip approval” → numbered clips modal; approve or reject.',
    videoTicketIds: ['v-clips-gate'],
    loginHint: 'client@scalebrandslab.demo',
  },
  {
    stage: 'clips_ready_intake',
    batchId: 'b-clips-ready',
    batchTitle: 'August Clips Pack',
    clientId: PATH_B_DEMO_CLIENT_ID,
    clientBoardExpectation:
      'In progress: “Production in progress” → numbered clips modal (read-only) + team-working banner.',
    videoTicketIds: ['v-clips-ready-gate'],
    loginHint: 'client@scalebrandslab.demo',
  },
  {
    stage: 'pre_split_production',
    batchId: 'b-editing',
    batchTitle: 'April B-Roll Pack',
    clientId: PATH_B_DEMO_CLIENT_ID,
    clientBoardExpectation:
      'Single batch card → clips modal. Editor: “Submit videos for this batch”.',
    videoTicketIds: ['v-editing-gate'],
    loginHint: 'Editor login (Arnav) for submit-deliverables CTA',
  },
  {
    stage: 'production',
    batchId: 'b-pipeline',
    batchTitle: 'Q2 Tech Breakdown',
    clientId: PATH_B_DEMO_CLIENT_ID,
    clientBoardExpectation:
      'Five cards — see per-video stages in PATH_B_PIPELINE_VIDEO_DEMOS.',
    videoTicketIds: ['v-p-1', 'v-p-2', 'v-p-3', 'v-p-4', 'v-p-5'],
    loginHint: 'Rotate through cards for SMM QA, fix, client QA, missing assets',
  },
  {
    stage: 'scheduling',
    batchId: 'b-schedule',
    batchTitle: 'Product Launch Series',
    clientId: PATH_B_DEMO_CLIENT_ID,
    clientBoardExpectation:
      'Schedule column: v-sc-1 already scheduled; v-sc-2 and v-sc-3 need per-video go-live (no publish URL).',
    videoTicketIds: ['v-sc-1', 'v-sc-2', 'v-sc-3'],
    loginHint: 'SMM: Set go-live on each scheduling card',
  },
  {
    stage: 'completed',
    batchId: 'b-archive',
    batchTitle: 'March Compilation',
    clientId: PATH_B_DEMO_CLIENT_ID,
    clientBoardExpectation: 'Completed column; credits already debited.',
    videoTicketIds: ['v-arch-1', 'v-arch-2', 'v-arch-3', 'v-arch-4'],
    loginHint: '/client/all for scheduled history',
  },
]

/** Per-video breakdown inside b-pipeline (one batch, every mid-stage). */
export const PATH_B_PIPELINE_VIDEO_DEMOS: {
  videoId: string
  deliverableIndex: number
  stage: PathBDemoStage
  stageLabel: string
  owner: 'smm' | 'editor' | 'client'
  uiFocus: string
}[] = [
  {
    videoId: 'v-p-1',
    deliverableIndex: 1,
    stage: 'smm_qa',
    stageLabel: 'SMM QA',
    owner: 'smm',
    uiFocus: 'SMM QA workspace — active comments, approve to release client',
  },
  {
    videoId: 'v-p-2',
    deliverableIndex: 2,
    stage: 'editor_fix',
    stageLabel: 'QA flagged',
    owner: 'editor',
    uiFocus: 'Editor fix — sold SMM comment + re-upload video on Drive',
  },
  {
    videoId: 'v-p-3',
    deliverableIndex: 3,
    stage: 'client_qa',
    stageLabel: 'Client QA',
    owner: 'client',
    uiFocus: 'Unified client QA — video + thumb + title',
  },
  {
    videoId: 'v-p-4',
    deliverableIndex: 4,
    stage: 'production',
    stageLabel: 'Production — thumbnail',
    owner: 'editor',
    uiFocus: 'Missing thumbnail — sync thumbs folder / upload',
  },
  {
    videoId: 'v-p-5',
    deliverableIndex: 5,
    stage: 'production',
    stageLabel: 'Production — title',
    owner: 'editor',
    uiFocus: 'Missing video title — DB input only',
  },
]

export function getPathBDemoScenario(batchId: string): PathBDemoScenario | undefined {
  return PATH_B_DEMO_SCENARIOS.find((s) => s.batchId === batchId)
}

export function getPathBDemoStageLabel(stage: PathBDemoStage): string {
  const labels: Record<PathBDemoStage, string> = {
    intake_pending: 'Awaiting client intake',
    clips_identifying: 'Clip identification',
    clip_client_review: 'Clip review',
    clips_ready_intake: 'Clips ready — production',
    pre_split_production: 'Awaiting deliverables folder',
    production: 'Production',
    smm_qa: 'SMM QA',
    editor_fix: 'QA flagged',
    client_qa: 'Client QA',
    revision_via_smm: 'Client revisions',
    scheduling: 'Scheduling',
    completed: 'Scheduled',
  }
  return labels[stage]
}
