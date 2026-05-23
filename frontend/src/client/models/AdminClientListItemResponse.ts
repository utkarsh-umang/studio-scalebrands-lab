/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignedStaffResponse } from './AssignedStaffResponse';
import type { ClientAccountStatus } from './ClientAccountStatus';
export type AdminClientListItemResponse = {
    id: string;
    displayName: string;
    loginEmail: string;
    credits: number;
    accountStatus: ClientAccountStatus;
    activeBatchNumber?: (number | null);
    reservedCredits: number;
    assignedSmm: AssignedStaffResponse;
    assignedEditor: AssignedStaffResponse;
    createdAt: string;
};

