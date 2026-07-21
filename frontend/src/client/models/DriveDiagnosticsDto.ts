/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DriveClientThumbnailsDiagnosticsDto } from './DriveClientThumbnailsDiagnosticsDto';
import type { DriveClipsDiagnosticsDto } from './DriveClipsDiagnosticsDto';
import type { DriveDeliverablesDiagnosticsDto } from './DriveDeliverablesDiagnosticsDto';
export type DriveDiagnosticsDto = {
    serviceAccountEmail?: (string | null);
    clips: DriveClipsDiagnosticsDto;
    deliverables: DriveDeliverablesDiagnosticsDto;
    clientThumbnails?: (DriveClientThumbnailsDiagnosticsDto | null);
};

