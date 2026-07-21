/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppendQaCommentRequest } from '../models/AppendQaCommentRequest';
import type { AppendQaCommentResponse } from '../models/AppendQaCommentResponse';
import type { ClientRevisionTriageRequest } from '../models/ClientRevisionTriageRequest';
import type { DeliverableDriveSyncRequest } from '../models/DeliverableDriveSyncRequest';
import type { ProductionTicketResponse } from '../models/ProductionTicketResponse';
import type { QaTicketResponse } from '../models/QaTicketResponse';
import type { ResubmitToSmmQaRequest } from '../models/ResubmitToSmmQaRequest';
import type { ScheduleVideoRequest } from '../models/ScheduleVideoRequest';
import type { ScheduleVideoResponse } from '../models/ScheduleVideoResponse';
import type { SubmitSmmQaRequest } from '../models/SubmitSmmQaRequest';
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
    /**
     * Submit Smm Qa Review
     * @param videoTicketId
     * @param requestBody
     * @returns QaTicketResponse Successful Response
     * @throws ApiError
     */
    public static submitSmmQaReviewApiV1VideosVideoTicketIdSmmQaPost(
        videoTicketId: string,
        requestBody: SubmitSmmQaRequest,
    ): CancelablePromise<QaTicketResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/videos/{video_ticket_id}/smm-qa',
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
     * Append Qa Comment
     * @param videoTicketId
     * @param requestBody
     * @returns AppendQaCommentResponse Successful Response
     * @throws ApiError
     */
    public static appendQaCommentApiV1VideosVideoTicketIdQaCommentsPost(
        videoTicketId: string,
        requestBody: AppendQaCommentRequest,
    ): CancelablePromise<AppendQaCommentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/videos/{video_ticket_id}/qa-comments',
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
     * Triage Client Revision
     * @param videoTicketId
     * @param requestBody
     * @returns QaTicketResponse Successful Response
     * @throws ApiError
     */
    public static triageClientRevisionApiV1VideosVideoTicketIdClientRevisionTriagePost(
        videoTicketId: string,
        requestBody: ClientRevisionTriageRequest,
    ): CancelablePromise<QaTicketResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/videos/{video_ticket_id}/client-revision-triage',
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
     * Schedule Video
     * @param videoTicketId
     * @param requestBody
     * @returns ScheduleVideoResponse Successful Response
     * @throws ApiError
     */
    public static scheduleVideoApiV1VideosVideoTicketIdSchedulePost(
        videoTicketId: string,
        requestBody: ScheduleVideoRequest,
    ): CancelablePromise<ScheduleVideoResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/videos/{video_ticket_id}/schedule',
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
     * Resubmit To Smm Qa
     * @param videoTicketId
     * @param requestBody
     * @returns QaTicketResponse Successful Response
     * @throws ApiError
     */
    public static resubmitToSmmQaApiV1VideosVideoTicketIdResubmitToSmmQaPost(
        videoTicketId: string,
        requestBody?: ResubmitToSmmQaRequest,
    ): CancelablePromise<QaTicketResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/videos/{video_ticket_id}/resubmit-to-smm-qa',
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
