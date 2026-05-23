import type {
  AdminBatchFolderResponse,
  AdminClientListItemResponse,
  AdminClientProfileResponse,
  AdminPipelineItemResponse,
  AdminPipelineSummaryResponse,
  AdminVideoTicketResponse,
} from '@/client'
import type {
  AdminBatchFolder,
  AdminClientProfile,
  AdminVideoTicket,
  QaComment,
  StaffMember,
} from '@mockData/index'
import type {
  AdminPipelineItem,
  AdminPipelineSummary,
} from '@mockData/adminDashboard'

export function mapClientProfile(api: AdminClientProfileResponse): AdminClientProfile {
  return {
    id: api.id,
    loginId: api.loginEmail,
    password: '',
    displayName: api.displayName,
    credits: api.credits,
    accountStatus: api.accountStatus,
    decommissionReason: api.decommissionReason ?? undefined,
    decommissionedAt: api.decommissionedAt ?? undefined,
    createdAt: api.createdAt,
    assignedSmmId: api.assignedSmmId,
    assignedSmmName: api.assignedSmmName,
    assignedEditorId: api.assignedEditorId,
    assignedEditorName: api.assignedEditorName,
    brandGuidelines: {
      source: api.brandGuidelines.source,
      summary: api.brandGuidelines.summary,
      googleDocUrl: api.brandGuidelines.googleDocUrl ?? undefined,
      lastUpdatedAt: api.brandGuidelines.lastUpdatedAt,
    },
  }
}

export function mapClientListItem(api: AdminClientListItemResponse): AdminClientProfile {
  return {
    id: api.id,
    loginId: api.loginEmail,
    password: '',
    displayName: api.displayName,
    credits: api.credits,
    accountStatus: api.accountStatus,
    createdAt: api.createdAt,
    assignedSmmId: api.assignedSmm.id,
    assignedSmmName: api.assignedSmm.name,
    assignedEditorId: api.assignedEditor.id,
    assignedEditorName: api.assignedEditor.name,
    brandGuidelines: {
      source: 'internal',
      summary: '',
      lastUpdatedAt: api.createdAt,
    },
  }
}

export function mapBatchFolder(api: AdminBatchFolderResponse): AdminBatchFolder {
  return {
    id: api.id,
    clientId: api.clientId,
    batchNumber: api.batchNumber,
    title: api.title,
    status: api.status,
    videoCount: api.videoCount,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    completedAt: api.completedAt ?? undefined,
    footageUrl: api.footageUrl ?? undefined,
    sourceMediaUrl: api.sourceMediaUrl ?? undefined,
    intakePath: api.intakePath ?? undefined,
    clipReviewPhase: api.clipReviewPhase ?? undefined,
    clipsFolderUrl: api.clipsFolderUrl ?? undefined,
    editorDeliverablesDriveUrl: api.editorDeliverablesDriveUrl ?? undefined,
    creditCost: api.creditCost,
    creditsDebited: api.creditsDebited,
    demoStage: api.demoStage ?? api.pipelineStage,
    batchSchedule: api.batchSchedule
      ? {
          platform: String(api.batchSchedule.platform ?? ''),
          goLiveAt: String(api.batchSchedule.goLiveAt ?? ''),
          completedAt: String(api.batchSchedule.completedAt ?? ''),
          videoPublishLinks:
            api.batchSchedule.videoPublishLinks &&
            typeof api.batchSchedule.videoPublishLinks === 'object'
              ? (api.batchSchedule.videoPublishLinks as Record<string, string>)
              : undefined,
        }
      : undefined,
  }
}

export function mapVideoTicket(api: AdminVideoTicketResponse): AdminVideoTicket {
  return {
    id: api.id,
    batchId: api.batchId,
    clientId: api.clientId,
    title: api.title,
    owner: api.owner,
    stageLabel: api.stageLabel,
    deadlineRole:
      api.deadlineRole === 'smm' || api.deadlineRole === 'editor'
        ? api.deadlineRole
        : null,
    deadlineAt: api.deadlineAt ?? null,
    deliverableIndex: api.deliverableIndex ?? undefined,
    editorPhase: api.editorWorkflowPhase ?? undefined,
    editorPublishTitle: api.editorPublishTitle ?? undefined,
    releasedToClientFinalVideoReview: api.releasedToClientFinalReview,
    lastRevisionRequestedBy:
      api.lastRevisionRequestedBy === 'smm' ||
      api.lastRevisionRequestedBy === 'client'
        ? api.lastRevisionRequestedBy
        : undefined,
    assetVersions: api.assetVersions ?? undefined,
    deliverableDriveSlots: api.deliverableDriveSlots ?? undefined,
    driveSlotsSyncedAt: api.driveSlotsSyncedAt ?? undefined,
    qaFlags: api.qaFlags ?? undefined,
    qaGeneralNote: api.qaGeneralNote ?? undefined,
    qaCommentHistory: api.qaCommentHistory?.map(
      (c): QaComment => ({
        id: c.id,
        slot: c.slot as QaComment['slot'],
        assetVersion: c.assetVersion,
        kind: c.kind as QaComment['kind'],
        authorRole: c.authorRole as QaComment['authorRole'],
        atSeconds: c.atSeconds ?? undefined,
        body: c.body,
        createdAt: c.createdAt,
        deprecated: c.deprecated ?? false,
      }),
    ),
    demoStage: api.demoStage ?? undefined,
    videoSchedule: api.videoSchedule
      ? {
          platform: String(api.videoSchedule.platform ?? ''),
          goLiveAt: String(api.videoSchedule.goLiveAt ?? ''),
          scheduledAt: String(api.videoSchedule.scheduledAt ?? ''),
        }
      : undefined,
  }
}

export function mapPipelineSummary(
  api: AdminPipelineSummaryResponse,
): AdminPipelineSummary {
  return {
    withClient: api.withClient,
    withSmm: api.withSmm,
    withEditor: api.withEditor,
  }
}

export function mapPipelineItem(api: AdminPipelineItemResponse): AdminPipelineItem {
  return {
    id: api.id,
    clientId: api.clientId,
    batchTitle: api.batchTitle,
    clientLabel: api.clientLabel,
    owner: api.owner as AdminPipelineItem['owner'],
    stageLabel: api.stageLabel,
    updatedAt: api.updatedAt,
  }
}

export function mapStaffList(api: {
  smm: { id: string; name: string }[]
  editors: { id: string; name: string }[]
}): { smmStaff: StaffMember[]; editorStaff: StaffMember[] } {
  return {
    smmStaff: api.smm.map((s) => ({ id: s.id, name: s.name, role: 'smm' as const })),
    editorStaff: api.editors.map((e) => ({
      id: e.id,
      name: e.name,
      role: 'editor' as const,
    })),
  }
}
