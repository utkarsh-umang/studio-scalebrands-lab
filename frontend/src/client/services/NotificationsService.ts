/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MarkSeenResponse } from '../models/MarkSeenResponse';
import type { NotificationInboxResponse } from '../models/NotificationInboxResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotificationsService {
    /**
     * Get Notifications
     * @returns NotificationInboxResponse Successful Response
     * @throws ApiError
     */
    public static getNotificationsApiV1NotificationsGet(): CancelablePromise<NotificationInboxResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notifications',
        });
    }
    /**
     * Mark Notifications Seen
     * @returns MarkSeenResponse Successful Response
     * @throws ApiError
     */
    public static markNotificationsSeenApiV1NotificationsMarkSeenPost(): CancelablePromise<MarkSeenResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/notifications/mark-seen',
        });
    }
}
