/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApproveBatchClipsRequest } from '../models/ApproveBatchClipsRequest';
import type { BatchVideosResponse } from '../models/BatchVideosResponse';
import type { ClientQaRequest } from '../models/ClientQaRequest';
import type { ProductionTicketResponse } from '../models/ProductionTicketResponse';
import type { QaTicketResponse } from '../models/QaTicketResponse';
import type { RejectBatchClipsRequest } from '../models/RejectBatchClipsRequest';
import type { SetClientTitleRequest } from '../models/SetClientTitleRequest';
import type { SubmitBatchIntakeRequest } from '../models/SubmitBatchIntakeRequest';
import type { SubmitBatchIntakeResponse } from '../models/SubmitBatchIntakeResponse';
import type { SubmitClientThumbnailsRequest } from '../models/SubmitClientThumbnailsRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClientService {
    /**
     * Submit Batch Intake
     * @param batchId
     * @param requestBody
     * @returns SubmitBatchIntakeResponse Successful Response
     * @throws ApiError
     */
    public static submitBatchIntakeApiV1ClientBatchesBatchIdIntakePost(
        batchId: string,
        requestBody: SubmitBatchIntakeRequest,
    ): CancelablePromise<SubmitBatchIntakeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/batches/{batch_id}/intake',
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
     * Submit Client Thumbnails Folder
     * @param batchId
     * @param requestBody
     * @returns SubmitBatchIntakeResponse Successful Response
     * @throws ApiError
     */
    public static submitClientThumbnailsFolderApiV1ClientBatchesBatchIdThumbnailsFolderPost(
        batchId: string,
        requestBody: SubmitClientThumbnailsRequest,
    ): CancelablePromise<SubmitBatchIntakeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/batches/{batch_id}/thumbnails-folder',
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
     * Approve Batch Clips
     * @param batchId
     * @param requestBody
     * @returns BatchVideosResponse Successful Response
     * @throws ApiError
     */
    public static approveBatchClipsApiV1ClientBatchesBatchIdClipsApprovePost(
        batchId: string,
        requestBody: ApproveBatchClipsRequest,
    ): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/batches/{batch_id}/clips/approve',
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
     * Reject Batch Clips
     * @param batchId
     * @param requestBody
     * @returns BatchVideosResponse Successful Response
     * @throws ApiError
     */
    public static rejectBatchClipsApiV1ClientBatchesBatchIdClipsRejectPost(
        batchId: string,
        requestBody: RejectBatchClipsRequest,
    ): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/batches/{batch_id}/clips/reject',
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
     * Set Client Title
     * @param videoTicketId
     * @param requestBody
     * @returns ProductionTicketResponse Successful Response
     * @throws ApiError
     */
    public static setClientTitleApiV1ClientVideosVideoTicketIdTitlePost(
        videoTicketId: string,
        requestBody: SetClientTitleRequest,
    ): CancelablePromise<ProductionTicketResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/videos/{video_ticket_id}/title',
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
    /**
     * Submit Client Qa
     * @param videoTicketId
     * @param requestBody
     * @returns QaTicketResponse Successful Response
     * @throws ApiError
     */
    public static submitClientQaApiV1ClientVideosVideoTicketIdClientQaPost(
        videoTicketId: string,
        requestBody: ClientQaRequest,
    ): CancelablePromise<QaTicketResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/videos/{video_ticket_id}/client-qa',
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
