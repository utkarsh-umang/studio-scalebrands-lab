/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MediaAssetResponse } from './MediaAssetResponse';
export type InitiateMediaUploadResponse = {
    asset: MediaAssetResponse;
    uploadUrl: string;
    uploadMethod?: string;
    uploadHeaders: Record<string, string>;
    expiresAt: string;
};
