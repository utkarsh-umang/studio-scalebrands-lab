"""Shared admin queries and computed fields."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import BatchStatus, ClientAccountStatus, EmployeeKind, UserRole
from app.models.user import User


async def get_profile_or_404(session: AsyncSession, client_id: UUID) -> ClientProfile:
    from fastapi import HTTPException, status

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


async def assert_client_active(profile: ClientProfile) -> None:
    from fastapi import HTTPException, status

    if profile.account_status != ClientAccountStatus.active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Client account is decommissioned",
            },
        )


async def get_client_login_email(session: AsyncSession, client_profile_id: UUID) -> str:
    result = await session.execute(
        select(User.email).where(
            User.client_profile_id == client_profile_id,
            User.role == UserRole.client,
        ),
    )
    email = result.scalar_one_or_none()
    if email is None:
        return ""
    return email


async def reserved_credits_for_client(session: AsyncSession, client_id: UUID) -> int:
    result = await session.execute(
        select(func.coalesce(func.sum(Batch.credit_cost), 0)).where(
            Batch.client_id == client_id,
            Batch.status == BatchStatus.active,
            Batch.credits_debited.is_(False),
        ),
    )
    return int(result.scalar_one())


async def credits_debited_total(session: AsyncSession, client_id: UUID) -> int:
    result = await session.execute(
        select(func.coalesce(func.sum(Batch.credit_cost), 0)).where(
            Batch.client_id == client_id,
            Batch.status == BatchStatus.completed,
            Batch.credits_debited.is_(True),
        ),
    )
    return int(result.scalar_one())


async def active_batch_number(session: AsyncSession, client_id: UUID) -> int | None:
    profile = await session.get(ClientProfile, client_id)
    if profile is None or profile.account_status != ClientAccountStatus.active:
        return None
    result = await session.execute(
        select(func.max(Batch.batch_number)).where(
            Batch.client_id == client_id,
            Batch.status == BatchStatus.active,
        ),
    )
    value = result.scalar_one_or_none()
    return int(value) if value is not None else None


async def first_employee_by_kind(session: AsyncSession, kind: EmployeeKind) -> User | None:
    result = await session.execute(
        select(User)
        .where(
            User.role == UserRole.employee,
            User.employee_kind == kind,
            User.is_active.is_(True),
        )
        .order_by(User.created_at)
        .limit(1),
    )
    return result.scalar_one_or_none()


async def load_staff_user(
    session: AsyncSession,
    user_id: UUID,
    *,
    expected_kind: EmployeeKind,
) -> User:
    from fastapi import HTTPException, status

    user = await session.get(User, user_id)
    if (
        user is None
        or not user.is_active
        or user.role != UserRole.employee
        or user.employee_kind != expected_kind
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": f"Invalid {expected_kind.value} staff id",
            },
        )
    return user
