/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminBatchFolderResponse } from './AdminBatchFolderResponse';
import type { AdminClientProfileResponse } from './AdminClientProfileResponse';
import type { AdminVideoTicketResponse } from './AdminVideoTicketResponse';
export type AdminWorkspaceResponse = {
    clients: Array<AdminClientProfileResponse>;
    batches: Array<AdminBatchFolderResponse>;
    videos: Array<AdminVideoTicketResponse>;
};

