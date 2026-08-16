"""Authenticated direct-upload and private playback endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.db.session import get_db_session
from app.schemas.media import (
    CompleteMediaUploadRequest,
    CompleteMediaUploadResponse,
    InitiateMediaUploadRequest,
    InitiateMediaUploadResponse,
    MediaAssetListResponse,
    MediaPlaybackResponse,
)
from app.services import media_service

router = APIRouter(prefix="/media", tags=["media"])


@router.post(
    "/videos/{video_ticket_id}/uploads",
    response_model=InitiateMediaUploadResponse,
)
async def initiate_media_upload(
    video_ticket_id: UUID,
    body: InitiateMediaUploadRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> InitiateMediaUploadResponse:
    return await media_service.initiate_upload(session, current_user, video_ticket_id, body)


@router.post(
    "/uploads/{asset_id}/complete",
    response_model=CompleteMediaUploadResponse,
)
async def complete_media_upload(
    asset_id: UUID,
    _body: CompleteMediaUploadRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CompleteMediaUploadResponse:
    return await media_service.complete_upload(session, current_user, asset_id)


@router.get(
    "/videos/{video_ticket_id}/assets",
    response_model=MediaAssetListResponse,
)
async def list_ticket_assets(
    video_ticket_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MediaAssetListResponse:
    return await media_service.list_ticket_assets(session, current_user, video_ticket_id)


@router.get(
    "/assets/{asset_id}/playback",
    response_model=MediaPlaybackResponse,
)
async def get_media_playback_url(
    asset_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MediaPlaybackResponse:
    return await media_service.playback_url(session, current_user, asset_id)
