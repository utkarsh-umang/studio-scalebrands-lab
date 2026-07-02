"""Per-batch activity / audit trail."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.db.session import get_db_session
from app.models.batch import Batch
from app.models.enums import UserRole
from app.schemas.activity import BatchActivityResponse
from app.services import activity_service

router = APIRouter(tags=["activity"])


@router.get("/batches/{batch_id}/activity", response_model=BatchActivityResponse)
async def get_batch_activity(
    batch_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BatchActivityResponse:
    batch = (
        await session.execute(select(Batch).where(Batch.id == batch_id))
    ).scalar_one_or_none()
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": "Batch not found"},
        )
    # Clients may only read their own batch's history; staff/admin may read any.
    if current_user.role == UserRole.client and current_user.client_profile_id != batch.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error_code": "FORBIDDEN", "message": "Insufficient permissions"},
        )
    items = await activity_service.list_batch_activity(session, batch_id)
    return BatchActivityResponse.model_validate({"items": items})
