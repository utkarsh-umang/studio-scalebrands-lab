/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchVideosResponse } from '../models/BatchVideosResponse';
import type { RejectIdeasRequest } from '../models/RejectIdeasRequest';
import type { SubmitIdeaFootageRequest } from '../models/SubmitIdeaFootageRequest';
import type { SubmitIdeasRequest } from '../models/SubmitIdeasRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class IdeasService {
    public static requestIdeas(batchId: string): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/batches/{batch_id}/request-ideas',
            path: { 'batch_id': batchId },
            errors: { 422: `Validation Error` },
        });
    }
    public static submitIdeas(batchId: string, requestBody: SubmitIdeasRequest): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/batches/{batch_id}/ideas',
            path: { 'batch_id': batchId },
            body: requestBody,
            mediaType: 'application/json',
            errors: { 422: `Validation Error` },
        });
    }
    public static approveIdeas(batchId: string): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/batches/{batch_id}/ideas/approve',
            path: { 'batch_id': batchId },
            errors: { 422: `Validation Error` },
        });
    }
    public static rejectIdeas(batchId: string, requestBody: RejectIdeasRequest): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/batches/{batch_id}/ideas/reject',
            path: { 'batch_id': batchId },
            body: requestBody,
            mediaType: 'application/json',
            errors: { 422: `Validation Error` },
        });
    }
    public static submitIdeaFootage(batchId: string, requestBody: SubmitIdeaFootageRequest): CancelablePromise<BatchVideosResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/client/batches/{batch_id}/idea-footage',
            path: { 'batch_id': batchId },
            body: requestBody,
            mediaType: 'application/json',
            errors: { 422: `Validation Error` },
        });
    }
}
