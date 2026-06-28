/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DriveMediaEntryDto } from './DriveMediaEntryDto';
import type { DriveUnmappedEntryDto } from './DriveUnmappedEntryDto';
export type BatchDriveManifestResponse = {
    batchId: string;
    syncedAt: string;
    clips?: Array<DriveMediaEntryDto>;
    videos?: Array<DriveMediaEntryDto>;
    thumbnails?: Array<DriveMediaEntryDto>;
    unmapped?: Array<DriveUnmappedEntryDto>;
};

