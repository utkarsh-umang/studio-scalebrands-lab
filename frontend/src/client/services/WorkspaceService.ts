/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminWorkspaceResponse } from '../models/AdminWorkspaceResponse';
import type { BatchDetailResponse } from '../models/BatchDetailResponse';
import type { ClientWorkspaceResponse } from '../models/ClientWorkspaceResponse';
import type { EditorWorkspaceResponse } from '../models/EditorWorkspaceResponse';
import type { SmmWorkspaceResponse } from '../models/SmmWorkspaceResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceService {
    /**
     * Client Workspace
     * @returns ClientWorkspaceResponse Successful Response
     * @throws ApiError
     */
    public static clientWorkspaceApiV1ClientWorkspaceGet(): CancelablePromise<ClientWorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/client/workspace',
        });
    }
    /**
     * Editor Workspace
     * @returns EditorWorkspaceResponse Successful Response
     * @throws ApiError
     */
    public static editorWorkspaceApiV1EditorWorkspaceGet(): CancelablePromise<EditorWorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/editor/workspace',
        });
    }
    /**
     * Smm Workspace
     * @returns SmmWorkspaceResponse Successful Response
     * @throws ApiError
     */
    public static smmWorkspaceApiV1SmmWorkspaceGet(): CancelablePromise<SmmWorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/smm/workspace',
        });
    }
    /**
     * Admin Workspace
     * @returns AdminWorkspaceResponse Successful Response
     * @throws ApiError
     */
    public static adminWorkspaceApiV1AdminWorkspaceGet(): CancelablePromise<AdminWorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/workspace',
        });
    }
    /**
     * Get Batch
     * @param batchId
     * @returns BatchDetailResponse Successful Response
     * @throws ApiError
     */
    public static getBatchApiV1BatchesBatchIdGet(
        batchId: string,
    ): CancelablePromise<BatchDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/batches/{batch_id}',
            path: {
                'batch_id': batchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
