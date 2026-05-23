"""Authentication business logic."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.models.client_profile import ClientProfile
from app.models.enums import ClientAccountStatus, UserRole
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse
from app.utils.security import create_access_token, hash_password, verify_password


def normalize_email(email: str) -> str:
    return email.strip().lower()


def user_to_me(user: User) -> MeResponse:
    return MeResponse(
        id=user.id,
        email=user.email,
        name=user.display_name,
        role=user.role,
        employee_kind=user.employee_kind if user.role == UserRole.employee else None,
        client_profile_id=user.client_profile_id if user.role == UserRole.client else None,
    )


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    normalized = normalize_email(email)
    result = await session.execute(
        select(User).where(func.lower(User.email) == normalized),
    )
    return result.scalar_one_or_none()


async def assert_user_can_login(session: AsyncSession, user: User) -> None:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password. Please try again.",
            },
        )
    if user.role != UserRole.client:
        return
    if user.client_profile_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password. Please try again.",
            },
        )
    profile = await session.get(ClientProfile, user.client_profile_id)
    if profile is None or profile.account_status == ClientAccountStatus.decommissioned:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password. Please try again.",
            },
        )


async def login(session: AsyncSession, body: LoginRequest) -> LoginResponse:
    user = await get_user_by_email(session, body.email)
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password. Please try again.",
            },
        )
    await assert_user_can_login(session, user)
    token = create_access_token(str(user.id))
    expires_in = config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return LoginResponse(
        access_token=token,
        expires_in=expires_in,
        user=user_to_me(user),
    )


async def upsert_user(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    display_name: str,
    role: UserRole,
    employee_kind=None,
    client_profile_id: UUID | None = None,
    is_active: bool = True,
) -> User:
    normalized = normalize_email(email)
    existing = await get_user_by_email(session, normalized)
    hashed = hash_password(password)
    if existing:
        existing.password_hash = hashed
        existing.display_name = display_name
        existing.role = role
        existing.employee_kind = employee_kind
        existing.client_profile_id = client_profile_id
        existing.is_active = is_active
        existing.touch_updated_at()
        session.add(existing)
        await session.flush()
        return existing
    user = User(
        email=normalized,
        password_hash=hashed,
        display_name=display_name,
        role=role,
        employee_kind=employee_kind,
        client_profile_id=client_profile_id,
        is_active=is_active,
    )
    session.add(user)
    await session.flush()
    return user
