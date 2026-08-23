/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QaCommentAttachmentDto } from './QaCommentAttachmentDto';
export type QaCommentDto = {
    id: string;
    slot: string;
    assetVersion: number;
    kind: string;
    authorRole: string;
    atSeconds?: (number | null);
    body: string;
    attachments?: Array<QaCommentAttachmentDto>;
    createdAt: string;
    deprecated?: boolean;
};

