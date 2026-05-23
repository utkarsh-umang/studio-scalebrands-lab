"""Role-scoped workspace reads (B2)."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import BatchStatus, ClientAccountStatus, EmployeeKind, UserRole
from app.models.user import User
from app.models.video_ticket import VideoTicket
from app.schemas.workspace import (
    AdminWorkspaceResponse,
    BatchDetailResponse,
    ClientWorkspaceResponse,
    EditorWorkspaceResponse,
    SmmWorkspaceResponse,
)
from app.services.admin_helpers import (
    active_batch_number,
    credits_debited_total,
    get_client_login_email,
    reserved_credits_for_client,
)
from app.services.workspace_access import (
    assert_batch_access,
    assert_client_role,
    assert_employee_kind,
    client_ids_for_employee,
    get_profile_or_404,
)
from app.services.workspace_mappers import batch_to_dto, client_profile_to_dto, video_to_dto


async def _load_users_by_id(session: AsyncSession, user_ids: set[UUID]) -> dict[UUID, User]:
    if not user_ids:
        return {}
    result = await session.execute(select(User).where(User.id.in_(user_ids)))
    return {user.id: user for user in result.scalars().all()}


async def _login_emails_for_clients(
    session: AsyncSession,
    client_ids: list[UUID],
) -> dict[UUID, str]:
    if not client_ids:
        return {}
    result = await session.execute(
        select(User.client_profile_id, User.email).where(
            User.role == UserRole.client,
            User.client_profile_id.in_(client_ids),
        ),
    )
    return {row[0]: row[1] for row in result.all() if row[0] is not None}


async def _profiles_to_dtos(
    session: AsyncSession,
    profiles: list[ClientProfile],
) -> list:
    if not profiles:
        return []
    staff_ids: set[UUID] = set()
    for profile in profiles:
        if profile.assigned_smm_id:
            staff_ids.add(profile.assigned_smm_id)
        if profile.assigned_editor_id:
            staff_ids.add(profile.assigned_editor_id)
    users_by_id = await _load_users_by_id(session, staff_ids)
    login_by_client = await _login_emails_for_clients(session, [p.id for p in profiles])

    dtos = []
    for profile in profiles:
        smm = users_by_id.get(profile.assigned_smm_id) if profile.assigned_smm_id else None
        editor = (
            users_by_id.get(profile.assigned_editor_id) if profile.assigned_editor_id else None
        )
        if smm is None or editor is None:
            continue
        dtos.append(
            client_profile_to_dto(
                profile,
                login_email=login_by_client.get(profile.id, ""),
                smm=smm,
                editor=editor,
                reserved_credits=await reserved_credits_for_client(session, profile.id),
                credits_debited_total=await credits_debited_total(session, profile.id),
                active_batch_number=await active_batch_number(session, profile.id),
            ),
        )
    return dtos


async def _load_batches(
    session: AsyncSession,
    client_ids: list[UUID] | None,
) -> list[Batch]:
    query = select(Batch).order_by(Batch.updated_at.desc())
    if client_ids is not None:
        if not client_ids:
            return []
        query = query.where(Batch.client_id.in_(client_ids))
    result = await session.execute(query)
    return list(result.scalars().all())


async def _load_videos(
    session: AsyncSession,
    client_ids: list[UUID] | None,
    batch_ids: list[UUID] | None = None,
) -> list[VideoTicket]:
    query = select(VideoTicket).order_by(
        VideoTicket.batch_id,
        VideoTicket.deliverable_index.nullsfirst(),
        VideoTicket.created_at,
    )
    if client_ids is not None:
        if not client_ids:
            return []
        query = query.where(VideoTicket.client_id.in_(client_ids))
    if batch_ids is not None:
        if not batch_ids:
            return []
        query = query.where(VideoTicket.batch_id.in_(batch_ids))
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_client_workspace(
    session: AsyncSession,
    user: CurrentUser,
) -> ClientWorkspaceResponse:
    client_id = await assert_client_role(user)
    profile = await get_profile_or_404(session, client_id)
    if profile.account_status == ClientAccountStatus.decommissioned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Client account is decommissioned",
            },
        )

    profiles_dto = await _profiles_to_dtos(session, [profile])
    if not profiles_dto:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "Client profile is incomplete",
            },
        )

    batches = await _load_batches(session, [client_id])
    videos = await _load_videos(session, [client_id])
    return ClientWorkspaceResponse(
        client=profiles_dto[0],
        batches=[batch_to_dto(b) for b in batches],
        videos=[video_to_dto(v) for v in videos],
    )


async def _employee_workspace(
    session: AsyncSession,
    user: CurrentUser,
    kind: EmployeeKind,
) -> EditorWorkspaceResponse | SmmWorkspaceResponse:
    assert_employee_kind(user, kind)
    client_ids = await client_ids_for_employee(session, user, active_only=False)
    profiles_result = await session.execute(
        select(ClientProfile).where(ClientProfile.id.in_(client_ids)),
    )
    profiles = list(profiles_result.scalars().all())
    batches = await _load_batches(session, client_ids)
    videos = await _load_videos(session, client_ids)
    payload = {
        "clients": await _profiles_to_dtos(session, profiles),
        "batches": [batch_to_dto(b) for b in batches],
        "videos": [video_to_dto(v) for v in videos],
    }
    if kind == EmployeeKind.editor:
        return EditorWorkspaceResponse(**payload)
    return SmmWorkspaceResponse(**payload)


async def get_editor_workspace(
    session: AsyncSession,
    user: CurrentUser,
) -> EditorWorkspaceResponse:
    result = await _employee_workspace(session, user, EmployeeKind.editor)
    assert isinstance(result, EditorWorkspaceResponse)
    return result


async def get_smm_workspace(
    session: AsyncSession,
    user: CurrentUser,
) -> SmmWorkspaceResponse:
    result = await _employee_workspace(session, user, EmployeeKind.smm)
    assert isinstance(result, SmmWorkspaceResponse)
    return result


async def get_admin_workspace(
    session: AsyncSession,
    _user: CurrentUser,
) -> AdminWorkspaceResponse:
    profiles_result = await session.execute(
        select(ClientProfile).order_by(ClientProfile.created_at.desc()),
    )
    profiles = list(profiles_result.scalars().all())
    batches = await _load_batches(session, None)
    videos = await _load_videos(session, None)
    return AdminWorkspaceResponse(
        clients=await _profiles_to_dtos(session, profiles),
        batches=[batch_to_dto(b) for b in batches],
        videos=[video_to_dto(v) for v in videos],
    )


async def get_batch_detail(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
) -> BatchDetailResponse:
    batch = await assert_batch_access(session, user, batch_id)
    videos = await _load_videos(session, None, batch_ids=[batch_id])
    return BatchDetailResponse(
        batch=batch_to_dto(batch),
        videos=[video_to_dto(v) for v in videos],
    )
