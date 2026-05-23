/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchVideosResponse } from '../models/BatchVideosResponse';
import type { SubmitClipsFolderRequest } from '../models/SubmitClipsFolderRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BatchesService {
    /**
     * Submit Clips Folder
     * @param batchId
     * @param requestBody
     * @returns BatchVideosResponse Successful Response
     * @throws ApiError
     */
    public static submitClipsFolderApiV1BatchesBatchIdClipsFolderPost(
        batchId: string,
        requestBody: SubmitClipsFolderRequest,
    ): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/batches/{batch_id}/clips-folder',
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
