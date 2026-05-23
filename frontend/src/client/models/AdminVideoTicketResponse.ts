/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VideoPipelineOwner } from './VideoPipelineOwner';
export type AdminVideoTicketResponse = {
    id: string;
    batchId: string;
    clientId: string;
    title: string;
    owner: VideoPipelineOwner;
    stageLabel: string;
    deadlineRole?: (string | null);
    deadlineAt?: (string | null);
    deliverableIndex?: (number | null);
    editorPublishTitle?: (string | null);
    releasedToClientFinalReview?: boolean;
};

