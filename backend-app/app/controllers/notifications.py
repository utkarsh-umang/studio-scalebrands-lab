"""Notifications inbox — what's waiting on the current user."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.db.session import get_db_session
from app.schemas.notifications import (
    MarkSeenResponse,
    NotificationInboxResponse,
)
from app.services import notifications_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationInboxResponse)
async def get_notifications(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> NotificationInboxResponse:
    inbox = await notifications_service.list_inbox(session, current_user)
    return NotificationInboxResponse.model_validate(inbox)


@router.post("/mark-seen", response_model=MarkSeenResponse)
async def mark_notifications_seen(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MarkSeenResponse:
    result = await notifications_service.mark_seen(session, current_user)
    return MarkSeenResponse.model_validate(result)
