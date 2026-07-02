/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminBatchFolderResponse } from '../models/AdminBatchFolderResponse';
import type { CreditHistoryResponse } from '../models/CreditHistoryResponse';
import type { AdminClientListResponse } from '../models/AdminClientListResponse';
import type { AdminDeadlinesResponse } from '../models/AdminDeadlinesResponse';
import type { SetVideoDeadlineRequest } from '../models/SetVideoDeadlineRequest';
import type { SetVideoDeadlineResponse } from '../models/SetVideoDeadlineResponse';
import type { AdminClientProfileResponse } from '../models/AdminClientProfileResponse';
import type { AdminPipelineResponse } from '../models/AdminPipelineResponse';
import type { AdminVideoTicketResponse } from '../models/AdminVideoTicketResponse';
import type { CreateBatchRequest } from '../models/CreateBatchRequest';
import type { DecommissionClientRequest } from '../models/DecommissionClientRequest';
import type { ProvisionClientRequest } from '../models/ProvisionClientRequest';
import type { ProvisionClientResponse } from '../models/ProvisionClientResponse';
import type { ProvisionStaffRequest } from '../models/ProvisionStaffRequest';
import type { ProvisionStaffResponse } from '../models/ProvisionStaffResponse';
import type { StaffListResponse } from '../models/StaffListResponse';
import type { TopUpCreditsRequest } from '../models/TopUpCreditsRequest';
import type { UpdateBrandGuidelinesRequest } from '../models/UpdateBrandGuidelinesRequest';
import type { SetBatchAssignmentsRequest } from '../models/SetBatchAssignmentsRequest';
import type { UpdateClientTeamRequest } from '../models/UpdateClientTeamRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * List Clients
     * @returns AdminClientListResponse Successful Response
     * @throws ApiError
     */
    public static listClientsApiV1AdminClientsGet(): CancelablePromise<AdminClientListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/clients',
        });
    }
    /**
     * Provision Client
     * @param requestBody
     * @returns ProvisionClientResponse Successful Response
     * @throws ApiError
     */
    public static provisionClientApiV1AdminClientsPost(
        requestBody: ProvisionClientRequest,
    ): CancelablePromise<ProvisionClientResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/clients',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client
     * @param clientId
     * @returns AdminClientProfileResponse Successful Response
     * @throws ApiError
     */
    public static getClientApiV1AdminClientsClientIdGet(
        clientId: string,
    ): CancelablePromise<AdminClientProfileResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/clients/{client_id}',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Top Up Credits
     * @param clientId
     * @param requestBody
     * @returns AdminClientProfileResponse Successful Response
     * @throws ApiError
     */
    public static topUpCreditsApiV1AdminClientsClientIdCreditsTopUpPost(
        clientId: string,
        requestBody: TopUpCreditsRequest,
    ): CancelablePromise<AdminClientProfileResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/clients/{client_id}/credits/top-up',
            path: {
                'client_id': clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Decommission Client
     * @param clientId
     * @param requestBody
     * @returns AdminClientProfileResponse Successful Response
     * @throws ApiError
     */
    public static decommissionClientApiV1AdminClientsClientIdDecommissionPost(
        clientId: string,
        requestBody: DecommissionClientRequest,
    ): CancelablePromise<AdminClientProfileResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/clients/{client_id}/decommission',
            path: {
                'client_id': clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Client Team
     * @param clientId
     * @param requestBody
     * @returns AdminClientProfileResponse Successful Response
     * @throws ApiError
     */
    public static updateClientTeamApiV1AdminClientsClientIdTeamPatch(
        clientId: string,
        requestBody: UpdateClientTeamRequest,
    ): CancelablePromise<AdminClientProfileResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/clients/{client_id}/team',
            path: {
                'client_id': clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Credit History
     * @param clientId
     * @returns CreditHistoryResponse Successful Response
     * @throws ApiError
     */
    public static getCreditHistoryApiV1AdminClientsClientIdCreditHistoryGet(
        clientId: string,
    ): CancelablePromise<CreditHistoryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/clients/{client_id}/credit-history',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Set Batch Assignments
     * @param batchId
     * @param requestBody
     * @returns AdminBatchFolderResponse Successful Response
     * @throws ApiError
     */
    public static setBatchAssignmentsApiV1AdminBatchesBatchIdAssignmentsPatch(
        batchId: string,
        requestBody: SetBatchAssignmentsRequest,
    ): CancelablePromise<AdminBatchFolderResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/batches/{batch_id}/assignments',
            path: {
                'batch_id': batchId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Brand Guidelines
     * @param clientId
     * @param requestBody
     * @returns AdminClientProfileResponse Successful Response
     * @throws ApiError
     */
    public static updateBrandGuidelinesApiV1AdminClientsClientIdBrandGuidelinesPatch(
        clientId: string,
        requestBody: UpdateBrandGuidelinesRequest,
    ): CancelablePromise<AdminClientProfileResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/clients/{client_id}/brand-guidelines',
            path: {
                'client_id': clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Client Batches
     * @param clientId
     * @returns AdminBatchFolderResponse Successful Response
     * @throws ApiError
     */
    public static listClientBatchesApiV1AdminClientsClientIdBatchesGet(
        clientId: string,
    ): CancelablePromise<Array<AdminBatchFolderResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/clients/{client_id}/batches',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Batch
     * @param clientId
     * @param requestBody
     * @returns AdminBatchFolderResponse Successful Response
     * @throws ApiError
     */
    public static createBatchApiV1AdminClientsClientIdBatchesPost(
        clientId: string,
        requestBody: CreateBatchRequest,
    ): CancelablePromise<AdminBatchFolderResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/clients/{client_id}/batches',
            path: {
                'client_id': clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Batch Videos
     * @param clientId
     * @param batchId
     * @returns AdminVideoTicketResponse Successful Response
     * @throws ApiError
     */
    public static listBatchVideosApiV1AdminClientsClientIdBatchesBatchIdVideosGet(
        clientId: string,
        batchId: string,
    ): CancelablePromise<Array<AdminVideoTicketResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/clients/{client_id}/batches/{batch_id}/videos',
            path: {
                'client_id': clientId,
                'batch_id': batchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Staff
     * @returns StaffListResponse Successful Response
     * @throws ApiError
     */
    public static listStaffApiV1AdminStaffGet(): CancelablePromise<StaffListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/staff',
        });
    }
    /**
     * Provision Staff
     * @param requestBody
     * @returns ProvisionStaffResponse Successful Response
     * @throws ApiError
     */
    public static provisionStaffApiV1AdminStaffPost(
        requestBody: ProvisionStaffRequest,
    ): CancelablePromise<ProvisionStaffResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/staff',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Pipeline
     * @returns AdminPipelineResponse Successful Response
     * @throws ApiError
     */
    public static getPipelineApiV1AdminPipelineGet(): CancelablePromise<AdminPipelineResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/pipeline',
        });
    }
    /**
     * Get Deadlines
     * @returns AdminDeadlinesResponse Successful Response
     * @throws ApiError
     */
    public static getDeadlinesApiV1AdminDeadlinesGet(): CancelablePromise<AdminDeadlinesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/deadlines',
        });
    }
    /**
     * Set Video Deadline
     * @param videoTicketId
     * @param requestBody
     * @returns SetVideoDeadlineResponse Successful Response
     * @throws ApiError
     */
    public static setVideoDeadlineApiV1AdminVideosVideoTicketIdDeadlinePatch(
        videoTicketId: string,
        requestBody: SetVideoDeadlineRequest,
    ): CancelablePromise<SetVideoDeadlineResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/videos/{video_ticket_id}/deadline',
            path: {
                'video_ticket_id': videoTicketId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
