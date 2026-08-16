/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MediaAssetKind } from './MediaAssetKind';
import type { MediaAssetStatus } from './MediaAssetStatus';
export type MediaAssetResponse = {
    id: string;
    batchId: string;
    videoTicketId: (string | null);
    kind: MediaAssetKind;
    status: MediaAssetStatus;
    version: number;
    isCurrent: boolean;
    originalFilename: string;
    contentType: string;
    sizeBytes: (number | null);
    createdAt: string;
    readyAt: (string | null);
};
