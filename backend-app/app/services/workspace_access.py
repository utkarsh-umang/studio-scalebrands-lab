"""Workspace RBAC helpers (B2)."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import ClientAccountStatus, EmployeeKind, UserRole
from app.models.video_ticket import VideoTicket


async def assert_client_role(user: CurrentUser) -> UUID:
    if user.role != UserRole.client or user.client_profile_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Client workspace requires a linked client profile",
            },
        )
    return user.client_profile_id


def assert_employee_kind(user: CurrentUser, kind: EmployeeKind) -> None:
    if user.role != UserRole.employee or user.employee_kind != kind:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Insufficient permissions",
            },
        )


async def get_profile_or_404(session: AsyncSession, client_id: UUID) -> ClientProfile:
    profile = await session.get(ClientProfile, client_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Client {client_id} not found",
            },
        )
    return profile


async def assert_client_access(user: CurrentUser, profile: ClientProfile) -> None:
    if user.role == UserRole.admin:
        return
    if user.role == UserRole.client:
        if user.client_profile_id != profile.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error_code": "NOT_FOUND",
                    "message": f"Client {profile.id} not found",
                },
            )
        return
    if user.role == UserRole.employee:
        if user.employee_kind == EmployeeKind.smm and profile.assigned_smm_id == user.id:
            return
        if user.employee_kind == EmployeeKind.editor and profile.assigned_editor_id == user.id:
            return
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "error_code": "NOT_FOUND",
            "message": f"Client {profile.id} not found",
        },
    )


async def assert_batch_access(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
) -> Batch:
    batch = await session.get(Batch, batch_id)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Batch {batch_id} not found",
            },
        )
    profile = await get_profile_or_404(session, batch.client_id)
    await assert_client_access(user, profile)
    return batch


async def assert_video_access(
    session: AsyncSession,
    user: CurrentUser,
    video_id: UUID,
) -> VideoTicket:
    ticket = await session.get(VideoTicket, video_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Video {video_id} not found",
            },
        )
    await assert_batch_access(session, user, ticket.batch_id)
    return ticket


async def client_ids_for_employee(
    session: AsyncSession,
    user: CurrentUser,
    *,
    active_only: bool,
) -> list[UUID]:
    if user.role != UserRole.employee or user.employee_kind not in (
        EmployeeKind.smm,
        EmployeeKind.editor,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Insufficient permissions",
            },
        )
    query = select(ClientProfile.id)
    if user.employee_kind == EmployeeKind.smm:
        query = query.where(ClientProfile.assigned_smm_id == user.id)
    else:
        query = query.where(ClientProfile.assigned_editor_id == user.id)
    if active_only:
        query = query.where(ClientProfile.account_status == ClientAccountStatus.active)
    result = await session.execute(query)
    return list(result.scalars().all())
