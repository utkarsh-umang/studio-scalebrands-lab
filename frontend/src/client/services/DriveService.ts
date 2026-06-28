/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchDriveManifestResponse } from '../models/BatchDriveManifestResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DriveService {
    /**
     * Get Batch Drive Manifest
     * Fetch the live Drive manifest (clips / videos / thumbnails) for a batch.
     * @param batchId
     * @returns BatchDriveManifestResponse Successful Response
     * @throws ApiError
     */
    public static getBatchDriveManifestApiV1DriveBatchesBatchIdManifestGet(
        batchId: string,
    ): CancelablePromise<BatchDriveManifestResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/drive/batches/{batch_id}/manifest',
            path: {
                'batch_id': batchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
