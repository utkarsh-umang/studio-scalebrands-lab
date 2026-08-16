/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MediaAssetKind } from './MediaAssetKind';
export type InitiateMediaUploadRequest = {
    kind: MediaAssetKind;
    filename: string;
    contentType: string;
    sizeBytes: number;
};
