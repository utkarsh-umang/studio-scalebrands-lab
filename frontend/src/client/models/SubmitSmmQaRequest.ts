/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TimestampFlagInput } from './TimestampFlagInput';
export type SubmitSmmQaRequest = {
    action: SubmitSmmQaRequest.action;
    commentBody?: (string | null);
    timestampFlags?: (Array<TimestampFlagInput> | null);
    generalNote?: (string | null);
};
export namespace SubmitSmmQaRequest {
    export enum action {
        APPROVE = 'approve',
        SEND_BACK = 'send_back',
    }
}

