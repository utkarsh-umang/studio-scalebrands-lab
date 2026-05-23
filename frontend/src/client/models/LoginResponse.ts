/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MeResponse } from './MeResponse';
export type LoginResponse = {
    accessToken: string;
    tokenType?: string;
    expiresIn: number;
    user: MeResponse;
};

