/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompleteMediaUploadRequest } from '../models/CompleteMediaUploadRequest';
import type { CompleteMediaUploadResponse } from '../models/CompleteMediaUploadResponse';
import type { InitiateMediaUploadRequest } from '../models/InitiateMediaUploadRequest';
import type { InitiateMediaUploadResponse } from '../models/InitiateMediaUploadResponse';
import type { MediaAssetListResponse } from '../models/MediaAssetListResponse';
import type { MediaPlaybackResponse } from '../models/MediaPlaybackResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MediaService {
    /**
     * Initiate Media Upload
     * @param videoTicketId
     * @param requestBody
     * @returns InitiateMediaUploadResponse Successful Response
     * @throws ApiError
     */
    public static initiateMediaUploadApiV1MediaVideosVideoTicketIdUploadsPost(
        videoTicketId: string,
        requestBody: InitiateMediaUploadRequest,
    ): CancelablePromise<InitiateMediaUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/media/videos/{video_ticket_id}/uploads',
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
     * Complete Media Upload
     * @param assetId
     * @param requestBody
     * @returns CompleteMediaUploadResponse Successful Response
     * @throws ApiError
     */
    public static completeMediaUploadApiV1MediaUploadsAssetIdCompletePost(
        assetId: string,
        requestBody: CompleteMediaUploadRequest,
    ): CancelablePromise<CompleteMediaUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/media/uploads/{asset_id}/complete',
            path: {
                'asset_id': assetId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Ticket Assets
     * @param videoTicketId
     * @returns MediaAssetListResponse Successful Response
     * @throws ApiError
     */
    public static listTicketAssetsApiV1MediaVideosVideoTicketIdAssetsGet(
        videoTicketId: string,
    ): CancelablePromise<MediaAssetListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/media/videos/{video_ticket_id}/assets',
            path: {
                'video_ticket_id': videoTicketId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Media Playback Url
     * @param assetId
     * @returns MediaPlaybackResponse Successful Response
     * @throws ApiError
     */
    public static getMediaPlaybackUrlApiV1MediaAssetsAssetIdPlaybackGet(
        assetId: string,
    ): CancelablePromise<MediaPlaybackResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/media/assets/{asset_id}/playback',
            path: {
                'asset_id': assetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
