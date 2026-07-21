/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EditorWorkflowPhase } from './EditorWorkflowPhase';
import type { PipelineStage } from './PipelineStage';
import type { QaCommentDto } from './QaCommentDto';
import type { VideoPipelineOwner } from './VideoPipelineOwner';
export type AdminVideoTicketResponse = {
    id: string;
    batchId: string;
    clientId: string;
    title: string;
    owner: VideoPipelineOwner;
    pipelineStage: PipelineStage;
    stageLabel: string;
    deadlineRole?: (string | null);
    deadlineAt?: (string | null);
    deliverableIndex?: (number | null);
    editorWorkflowPhase?: (EditorWorkflowPhase | null);
    editorPublishTitle?: (string | null);
    releasedToClientFinalReview?: boolean;
    lastRevisionRequestedBy?: (string | null);
    assetVersions?: (Record<string, any> | null);
    deliverableDriveSlots?: (Record<string, any> | null);
    driveSlotsSyncedAt?: (string | null);
    qaFlags?: null;
    qaGeneralNote?: (string | null);
    qaCommentHistory?: Array<QaCommentDto>;
    videoSchedule?: (Record<string, any> | null);
    demoStage?: (PipelineStage | null);
};

