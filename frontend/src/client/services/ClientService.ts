/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApproveBatchClipsRequest } from '../models/ApproveBatchClipsRequest';
import type { BatchVideosResponse } from '../models/BatchVideosResponse';
import type { RejectBatchClipsRequest } from '../models/RejectBatchClipsRequest';
import type { SubmitBatchIntakeRequest } from '../models/SubmitBatchIntakeRequest';
import type { SubmitBatchIntakeResponse } from '../models/SubmitBatchIntakeResponse';
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
                409: `Conflict`,
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
}
