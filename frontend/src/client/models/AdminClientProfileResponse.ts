/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BrandGuidelinesResponse } from './BrandGuidelinesResponse';
import type { ClientAccountStatus } from './ClientAccountStatus';
export type AdminClientProfileResponse = {
    id: string;
    loginEmail: string;
    displayName: string;
    credits: number;
    accountStatus: ClientAccountStatus;
    decommissionReason?: (string | null);
    decommissionedAt?: (string | null);
    createdAt: string;
    assignedSmmId: string;
    assignedSmmName: string;
    assignedEditorId: string;
    assignedEditorName: string;
    brandGuidelines: BrandGuidelinesResponse;
    reservedCredits: number;
    creditsDebitedTotal: number;
    activeBatchNumber?: (number | null);
};

