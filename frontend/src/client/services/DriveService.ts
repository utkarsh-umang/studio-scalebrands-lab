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
    /**
     * Stream Drive File
     * Stream a Drive file's bytes via the service account.
     *
     * The browser talks only to Studio (which it is already logged into), so the
     * viewer never needs to be signed into Google. Forwards Range so <video> seek
     * works.
     * @param fileId
     * @param accessToken
     * @returns any Successful Response
     * @throws ApiError
     */
    public static streamDriveFileApiV1DriveFilesFileIdContentGet(
        fileId: string,
        accessToken?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/drive/files/{file_id}/content',
            path: {
                'file_id': fileId,
            },
            query: {
                'access_token': accessToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
