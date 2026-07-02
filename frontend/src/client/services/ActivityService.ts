/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchActivityResponse } from '../models/BatchActivityResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ActivityService {
    /**
     * Get Batch Activity
     * @param batchId
     * @returns BatchActivityResponse Successful Response
     * @throws ApiError
     */
    public static getBatchActivityApiV1BatchesBatchIdActivityGet(
        batchId: string,
    ): CancelablePromise<BatchActivityResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/batches/{batch_id}/activity',
            path: {
                'batch_id': batchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
