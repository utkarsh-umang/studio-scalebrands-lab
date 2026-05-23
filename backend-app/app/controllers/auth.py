"""Auth endpoints — login and session."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.db.session import get_db_session
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> LoginResponse:
    return await auth_service.login(session, body)


@router.get("/me", response_model=MeResponse)
async def me(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> MeResponse:
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        employee_kind=current_user.employee_kind,
        client_profile_id=current_user.client_profile_id,
    )
