/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchClipReviewPhase } from './BatchClipReviewPhase';
import type { BatchIntakePath } from './BatchIntakePath';
import type { BatchStatus } from './BatchStatus';
import type { PipelineStage } from './PipelineStage';
export type AdminBatchFolderResponse = {
    id: string;
    clientId: string;
    batchNumber: number;
    title: string;
    status: BatchStatus;
    videoCount: number;
    createdAt: string;
    updatedAt: string;
    completedAt?: (string | null);
    footageUrl?: (string | null);
    sourceMediaUrl?: (string | null);
    intakePath?: (BatchIntakePath | null);
    clipReviewPhase?: (BatchClipReviewPhase | null);
    clipsFolderUrl?: (string | null);
    editorDeliverablesDriveUrl?: (string | null);
    creditCost: number;
    creditsDebited: boolean;
    pipelineStage: PipelineStage;
    demoStage?: (PipelineStage | null);
};

