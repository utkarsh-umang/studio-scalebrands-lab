/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One row in the admin pipeline list.
 *
 * Rows come grouped: a `batch` header followed by its `video` rows. Pre-split
 * batches emit only a header, and that header keeps the owner chip since the
 * batch is still the unit of work.
 */
export type AdminPipelineItemResponse = {
    id: string;
    kind?: string;
    batchId: string;
    clientId: string;
    batchTitle: string;
    clientLabel: string;
    owner?: (string | null);
    stageLabel: string;
    updatedAt: string;
    deliverableIndex?: (number | null);
    openVideoCount?: (number | null);
    totalVideoCount?: (number | null);
    scheduleLabel?: (string | null);
};

