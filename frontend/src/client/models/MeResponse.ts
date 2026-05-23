/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmployeeKind } from './EmployeeKind';
import type { UserRole } from './UserRole';
export type MeResponse = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    employeeKind?: (EmployeeKind | null);
    clientProfileId?: (string | null);
};

