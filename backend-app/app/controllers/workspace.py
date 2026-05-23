"""Workspace read endpoints (B2)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, require_roles
from app.db.session import get_db_session
from app.schemas.workspace import (
    AdminWorkspaceResponse,
    BatchDetailResponse,
    ClientWorkspaceResponse,
    EditorWorkspaceResponse,
    SmmWorkspaceResponse,
)
from app.services import workspace_service

router = APIRouter(tags=["workspace"])


@router.get("/client/workspace", response_model=ClientWorkspaceResponse)
async def client_workspace(
    current_user: Annotated[CurrentUser, Depends(require_roles("client"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ClientWorkspaceResponse:
    return await workspace_service.get_client_workspace(session, current_user)


@router.get("/editor/workspace", response_model=EditorWorkspaceResponse)
async def editor_workspace(
    current_user: Annotated[CurrentUser, Depends(require_roles("employee", "editor"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EditorWorkspaceResponse:
    return await workspace_service.get_editor_workspace(session, current_user)


@router.get("/smm/workspace", response_model=SmmWorkspaceResponse)
async def smm_workspace(
    current_user: Annotated[CurrentUser, Depends(require_roles("employee", "smm"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SmmWorkspaceResponse:
    return await workspace_service.get_smm_workspace(session, current_user)


@router.get("/admin/workspace", response_model=AdminWorkspaceResponse)
async def admin_workspace(
    current_user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminWorkspaceResponse:
    return await workspace_service.get_admin_workspace(session, current_user)


@router.get("/batches/{batch_id}", response_model=BatchDetailResponse)
async def get_batch(
    batch_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BatchDetailResponse:
    return await workspace_service.get_batch_detail(session, current_user, batch_id)
