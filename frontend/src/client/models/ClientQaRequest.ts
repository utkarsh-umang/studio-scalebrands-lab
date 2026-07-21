/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TimestampFlagInput } from './TimestampFlagInput';
export type ClientQaRequest = {
    action: ClientQaRequest.action;
    commentBody?: (string | null);
    timestampFlags?: (Array<TimestampFlagInput> | null);
    generalNote?: (string | null);
};
export namespace ClientQaRequest {
    export enum action {
        APPROVE = 'approve',
        REJECT = 'reject',
    }
}

