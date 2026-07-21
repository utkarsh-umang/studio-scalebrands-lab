/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminVideoTicketResponse } from './AdminVideoTicketResponse';
import type { DeliverableReadinessDto } from './DeliverableReadinessDto';
export type SubmitToSmmQaResponse = {
    ticket: AdminVideoTicketResponse;
    readiness: DeliverableReadinessDto;
    missing?: Array<string>;
};

