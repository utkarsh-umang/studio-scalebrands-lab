/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminBatchFolderResponse } from './AdminBatchFolderResponse';
import type { AdminVideoTicketResponse } from './AdminVideoTicketResponse';
import type { ScheduleVideoClientResponse } from './ScheduleVideoClientResponse';
export type ScheduleVideoResponse = {
    ticket: AdminVideoTicketResponse;
    batch: AdminBatchFolderResponse;
    client?: ScheduleVideoClientResponse | null;
};
