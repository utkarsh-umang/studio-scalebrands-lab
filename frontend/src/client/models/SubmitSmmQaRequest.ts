/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TimestampFlagInput } from './TimestampFlagInput';
export type SubmitSmmQaRequest = {
    action: 'approve' | 'send_back';
    commentBody?: string | null;
    timestampFlags?: Array<TimestampFlagInput> | null;
    generalNote?: string | null;
};
