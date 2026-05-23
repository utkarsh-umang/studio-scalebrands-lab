/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliverableDriveSyncRequest } from '../models/DeliverableDriveSyncRequest';
import type { ProductionTicketResponse } from '../models/ProductionTicketResponse';
import type { SubmitToSmmQaResponse } from '../models/SubmitToSmmQaResponse';
import type { UpdateProductionRequest } from '../models/UpdateProductionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VideosService {
    /**
     * Update Production
     * @param videoTicketId
     * @param requestBody
     * @returns ProductionTicketResponse Successful Response
     * @throws ApiError
     */
    public static updateProductionApiV1VideosVideoTicketIdProductionPatch(
        videoTicketId: string,
        requestBody: UpdateProductionRequest,
    ): CancelablePromise<ProductionTicketResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/videos/{video_ticket_id}/production',
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
     * Record Drive Sync
     * @param videoTicketId
     * @param requestBody
     * @returns ProductionTicketResponse Successful Response
     * @throws ApiError
     */
    public static recordDriveSyncApiV1VideosVideoTicketIdDriveSyncPost(
        videoTicketId: string,
        requestBody: DeliverableDriveSyncRequest,
    ): CancelablePromise<ProductionTicketResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/videos/{video_ticket_id}/drive-sync',
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
     * Submit To Smm Qa
     * @param videoTicketId
     * @returns SubmitToSmmQaResponse Successful Response
     * @throws ApiError
     */
    public static submitToSmmQaApiV1VideosVideoTicketIdSubmitToSmmQaPost(
        videoTicketId: string,
    ): CancelablePromise<SubmitToSmmQaResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/videos/{video_ticket_id}/submit-to-smm-qa',
            path: {
                'video_ticket_id': videoTicketId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
