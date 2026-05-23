"""JWT authentication and role guards."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.models.enums import EmployeeKind, UserRole
from app.models.user import User
from app.services.auth_service import get_user_by_id, user_to_me
from app.utils.security import user_id_from_token

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    """Authenticated user for dependencies and services."""

    id: UUID
    email: str
    name: str
    role: UserRole
    employee_kind: EmployeeKind | None = None
    client_profile_id: UUID | None = None

    @property
    def roles(self) -> list[str]:
        """Role strings for require_roles checks."""
        if self.role == UserRole.employee and self.employee_kind:
            return [UserRole.employee.value, self.employee_kind]
        return [self.role.value]


def _user_to_current(user: User) -> CurrentUser:
    me = user_to_me(user)
    return CurrentUser(
        id=me.id,
        email=me.email,
        name=me.name,
        role=me.role,
        employee_kind=me.employee_kind,
        client_profile_id=me.client_profile_id,
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "UNAUTHORIZED",
                "message": "Not authenticated",
            },
        )
    try:
        user_id = user_id_from_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "UNAUTHORIZED",
                "message": "Not authenticated",
            },
        ) from None
    user = await get_user_by_id(session, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "UNAUTHORIZED",
                "message": "Not authenticated",
            },
        )
    return _user_to_current(user)


async def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CurrentUser | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    try:
        user_id = user_id_from_token(credentials.credentials)
    except JWTError:
        return None
    user = await get_user_by_id(session, user_id)
    if user is None or not user.is_active:
        return None
    return _user_to_current(user)


def require_roles(*roles: str):
    """Dependency factory: user must have at least one of the given roles."""

    async def _require_roles(
        current_user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if not any(role in current_user.roles for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "FORBIDDEN",
                    "message": "Insufficient permissions",
                },
            )
        return current_user

    return _require_roles
