/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchVideosResponse } from '../models/BatchVideosResponse';
import type { SubmitDeliverablesDriveRequest } from '../models/SubmitDeliverablesDriveRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EditorService {
    /**
     * Submit Deliverables Drive
     * @param batchId
     * @param requestBody
     * @returns BatchVideosResponse Successful Response
     * @throws ApiError
     */
    public static submitDeliverablesDriveApiV1EditorBatchesBatchIdDeliverablesDrivePost(
        batchId: string,
        requestBody: SubmitDeliverablesDriveRequest,
    ): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/editor/batches/{batch_id}/deliverables-drive',
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
