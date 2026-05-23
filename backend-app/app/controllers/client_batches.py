"""Client batch commands (B3)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_roles
from app.db.session import get_db_session
from app.schemas.clips import (
    ApproveBatchClipsRequest,
    BatchVideosResponse,
    RejectBatchClipsRequest,
)
from app.schemas.intake import SubmitBatchIntakeRequest, SubmitBatchIntakeResponse
from app.services import clips_service, intake_service

router = APIRouter(prefix="/client", tags=["client"])


@router.post(
    "/batches/{batch_id}/intake",
    response_model=SubmitBatchIntakeResponse,
)
async def submit_batch_intake(
    batch_id: UUID,
    body: SubmitBatchIntakeRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles("client"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SubmitBatchIntakeResponse:
    return await intake_service.submit_client_intake(
        session,
        current_user,
        batch_id,
        body.intake_path,
        body.url,
    )


@router.post(
    "/batches/{batch_id}/clips/approve",
    response_model=BatchVideosResponse,
)
async def approve_batch_clips(
    batch_id: UUID,
    body: ApproveBatchClipsRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles("client"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BatchVideosResponse:
    return await clips_service.approve_batch_clips(
        session,
        current_user,
        batch_id,
        body.video_ticket_id,
        body.clip_count,
    )


@router.post(
    "/batches/{batch_id}/clips/reject",
    response_model=BatchVideosResponse,
)
async def reject_batch_clips(
    batch_id: UUID,
    body: RejectBatchClipsRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles("client"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BatchVideosResponse:
    return await clips_service.reject_batch_clips(
        session,
        current_user,
        batch_id,
        body.video_ticket_id,
        body.note,
    )
