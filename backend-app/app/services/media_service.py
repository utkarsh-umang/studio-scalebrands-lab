"""Media asset lifecycle on top of private object storage."""

import mimetypes
import re
from datetime import timedelta
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.config import config
from app.db.base import utc_now
from app.models.enums import MediaAssetKind, MediaAssetStatus, UserRole
from app.models.media_asset import MediaAsset
from app.models.video_ticket import VideoTicket
from app.schemas.media import (
    CompleteMediaUploadResponse,
    InitiateMediaUploadRequest,
    InitiateMediaUploadResponse,
    MediaAssetListResponse,
    MediaAssetResponse,
    MediaPlaybackResponse,
)
from app.services import object_storage_service
from app.services.object_storage_service import ObjectStorageError
from app.services.workspace_access import assert_batch_access, assert_video_access

_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-m4v"}
_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
_SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._-]+")


def _http_storage_error(exc: ObjectStorageError) -> HTTPException:
    code = status.HTTP_503_SERVICE_UNAVAILABLE
    if exc.code == "OBJECT_STORAGE_PROVIDER_ERROR":
        code = status.HTTP_502_BAD_GATEWAY
    return HTTPException(
        status_code=code,
        detail={"error_code": exc.code, "message": exc.message},
    )


def _asset_response(asset: MediaAsset) -> MediaAssetResponse:
    return MediaAssetResponse(
        id=asset.id,
        batch_id=asset.batch_id,
        video_ticket_id=asset.video_ticket_id,
        kind=asset.kind,
        status=asset.status,
        version=asset.version,
        is_current=asset.is_current,
        original_filename=asset.original_filename,
        content_type=asset.content_type,
        size_bytes=asset.size_bytes,
        created_at=asset.created_at,
        ready_at=asset.ready_at,
    )


def _clean_filename(raw: str) -> str:
    filename = Path(raw.strip()).name[:512]
    cleaned = _SAFE_FILENAME.sub("-", filename).strip(".-")
    return cleaned or "upload.bin"


def _validated_content_type(kind: MediaAssetKind, filename: str, raw: str) -> str:
    content_type = raw.strip().lower()
    if not content_type or content_type == "application/octet-stream":
        content_type = (mimetypes.guess_type(filename)[0] or "").lower()
    allowed = _IMAGE_TYPES if kind == MediaAssetKind.thumbnail else _VIDEO_TYPES
    if content_type not in allowed:
        expected = "an image (JPEG, PNG, or WebP)" if kind == MediaAssetKind.thumbnail else "a video (MP4, MOV, WebM, or M4V)"
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "UNSUPPORTED_MEDIA_TYPE",
                "message": f"Upload {expected}.",
            },
        )
    return content_type


def _assert_upload_role(user: CurrentUser, kind: MediaAssetKind) -> None:
    if user.role == UserRole.admin:
        return
    if user.role == UserRole.employee:
        return
    if user.role == UserRole.client and kind == MediaAssetKind.thumbnail:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"error_code": "FORBIDDEN", "message": "Insufficient permissions"},
    )


async def initiate_upload(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: InitiateMediaUploadRequest,
) -> InitiateMediaUploadResponse:
    ticket = await assert_video_access(session, user, video_ticket_id)
    _assert_upload_role(user, payload.kind)
    if payload.kind == MediaAssetKind.source_clip:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Source clips enter Studio through the client import flow.",
            },
        )
    if ticket.deliverable_index is None or ticket.deliverable_index < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Uploads require an individual production ticket.",
            },
        )
    if payload.size_bytes < 1 or payload.size_bytes > config.OBJECT_STORAGE_MAX_UPLOAD_BYTES:
        limit_gib = config.OBJECT_STORAGE_MAX_UPLOAD_BYTES / (1024**3)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "UPLOAD_SIZE_INVALID",
                "message": f"File must be larger than 0 bytes and no larger than {limit_gib:g} GiB.",
            },
        )

    filename = _clean_filename(payload.filename)
    content_type = _validated_content_type(payload.kind, filename, payload.content_type)
    version_result = await session.execute(
        select(func.max(MediaAsset.version)).where(
            MediaAsset.video_ticket_id == ticket.id,
            MediaAsset.kind == payload.kind,
        )
    )
    version = int(version_result.scalar_one_or_none() or 0) + 1
    asset = MediaAsset(
        batch_id=ticket.batch_id,
        video_ticket_id=ticket.id,
        uploaded_by_user_id=user.id,
        kind=payload.kind,
        status=MediaAssetStatus.pending,
        version=version,
        is_current=False,
        object_key="pending",
        original_filename=filename,
        content_type=content_type,
        expected_size_bytes=payload.size_bytes,
    )
    segment = "videos" if payload.kind == MediaAssetKind.video else "thumbnails"
    asset.object_key = (
        f"clients/{ticket.client_id}/batches/{ticket.batch_id}/{segment}/"
        f"{ticket.deliverable_index}/v{version}/{asset.id}-{filename}"
    )
    session.add(asset)
    await session.flush()

    try:
        upload_url = await object_storage_service.create_presigned_put(
            asset.object_key,
            content_type=content_type,
            asset_id=str(asset.id),
        )
    except ObjectStorageError as exc:
        asset.status = MediaAssetStatus.failed
        asset.error_message = exc.message
        session.add(asset)
        raise _http_storage_error(exc) from exc

    expires_at = utc_now() + timedelta(seconds=config.OBJECT_STORAGE_PRESIGN_SECONDS)
    return InitiateMediaUploadResponse(
        asset=_asset_response(asset),
        upload_url=upload_url,
        upload_headers={
            "Content-Type": content_type,
            "x-amz-meta-studio-asset-id": str(asset.id),
        },
        expires_at=expires_at,
    )


async def complete_upload(
    session: AsyncSession,
    user: CurrentUser,
    asset_id: UUID,
) -> CompleteMediaUploadResponse:
    asset = await session.get(MediaAsset, asset_id, with_for_update=True)
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": "Media asset not found"},
        )
    await assert_batch_access(session, user, asset.batch_id)
    if asset.status == MediaAssetStatus.ready:
        return CompleteMediaUploadResponse(asset=_asset_response(asset))
    try:
        stored = await object_storage_service.head_object(asset.object_key)
    except ObjectStorageError as exc:
        raise _http_storage_error(exc) from exc

    actual_size = int(stored.get("ContentLength") or 0)
    metadata = stored.get("Metadata") or {}
    if metadata.get("studio-asset-id") != str(asset.id) or actual_size != asset.expected_size_bytes:
        asset.status = MediaAssetStatus.failed
        asset.error_message = "Uploaded object did not match the initiated upload."
        session.add(asset)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "UPLOAD_VERIFICATION_FAILED",
                "message": "The uploaded file could not be verified. Upload it again.",
            },
        )

    await session.execute(
        update(MediaAsset)
        .where(
            MediaAsset.video_ticket_id == asset.video_ticket_id,
            MediaAsset.kind == asset.kind,
            MediaAsset.id != asset.id,
        )
        .values(is_current=False)
    )
    asset.status = MediaAssetStatus.ready
    asset.is_current = True
    asset.size_bytes = actual_size
    asset.etag = str(stored.get("ETag") or "").strip('"') or None
    asset.storage_version_id = stored.get("VersionId")
    asset.ready_at = utc_now()
    asset.error_message = None
    session.add(asset)

    if asset.video_ticket_id is not None:
        ticket = await session.get(VideoTicket, asset.video_ticket_id, with_for_update=True)
        if ticket is not None:
            kind = asset.kind.value
            slots = dict(ticket.deliverable_drive_slots or {})
            slots[kind] = {
                "assetId": str(asset.id),
                "objectKey": asset.object_key,
                "name": asset.original_filename,
                "mimeType": asset.content_type,
                "version": asset.version,
            }
            versions = dict(ticket.asset_versions or {})
            versions[kind] = asset.version
            ticket.deliverable_drive_slots = slots
            ticket.asset_versions = versions
            ticket.updated_at = utc_now()
            session.add(ticket)

    await session.flush()
    await session.refresh(asset)
    return CompleteMediaUploadResponse(asset=_asset_response(asset))


async def list_ticket_assets(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
) -> MediaAssetListResponse:
    await assert_video_access(session, user, video_ticket_id)
    result = await session.execute(
        select(MediaAsset)
        .where(MediaAsset.video_ticket_id == video_ticket_id)
        .order_by(MediaAsset.kind, MediaAsset.version.desc())
    )
    return MediaAssetListResponse(
        assets=[_asset_response(asset) for asset in result.scalars().all()]
    )


async def playback_url(
    session: AsyncSession,
    user: CurrentUser,
    asset_id: UUID,
) -> MediaPlaybackResponse:
    asset = await session.get(MediaAsset, asset_id)
    if asset is None or asset.status != MediaAssetStatus.ready:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": "Media asset not found"},
        )
    await assert_batch_access(session, user, asset.batch_id)
    try:
        url = await object_storage_service.create_presigned_get(
            asset.object_key,
            filename=asset.original_filename,
        )
    except ObjectStorageError as exc:
        raise _http_storage_error(exc) from exc
    return MediaPlaybackResponse(
        asset_id=asset.id,
        url=url,
        expires_at=utc_now() + timedelta(seconds=config.OBJECT_STORAGE_PRESIGN_SECONDS),
    )
