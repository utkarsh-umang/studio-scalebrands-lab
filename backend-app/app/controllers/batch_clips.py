"""Employee clip folder submission (B4)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_roles
from app.db.session import get_db_session
from app.schemas.clips import BatchVideosResponse, SubmitClipsFolderRequest
from app.services import clips_service

router = APIRouter(tags=["batches"])


@router.post(
    "/batches/{batch_id}/clips-folder",
    response_model=BatchVideosResponse,
)
async def submit_clips_folder(
    batch_id: UUID,
    body: SubmitClipsFolderRequest,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "editor", "smm")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BatchVideosResponse:
    return await clips_service.submit_clips_folder(
        session,
        current_user,
        batch_id,
        body.clips_folder_url,
    )
