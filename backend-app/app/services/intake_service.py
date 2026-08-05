"""Client batch intake (B3)."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.models.batch import Batch
from app.models.enums import BatchIntakePath, BatchStatus, UserRole
from app.models.video_ticket import VideoTicket
from app.schemas.intake import SubmitBatchIntakeResponse
from app.services import drive_manifest_service
from app.services.activity_service import record_activity
from app.services.admin_helpers import assert_client_active, get_profile_or_404
from app.services.drive_manifest_service import DriveManifestError
from app.services.path_b_transitions import (
    apply_clips_ready_intake,
    apply_source_media_intake,
    create_split_deliverable_ticket,
)
from app.services.workspace_access import assert_client_role
from app.services.workspace_mappers import batch_to_dto, video_to_dto

MAX_INTAKE_URL_LENGTH = 2048


async def _get_owned_active_batch(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
) -> Batch:
    if user.role != UserRole.client or user.client_profile_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Client role required",
            },
        )
    batch = await session.get(Batch, batch_id)
    if batch is None or batch.client_id != user.client_profile_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Batch {batch_id} not found",
            },
        )
    profile = await get_profile_or_404(session, batch.client_id)
    await assert_client_active(profile)
    if batch.status != BatchStatus.active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is not active",
            },
        )
    return batch


async def submit_client_thumbnails_folder(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
    url: str,
) -> SubmitBatchIntakeResponse:
    """Client links their own thumbnails folder.

    Deliberately separate from intake: clients who make their own thumbnails
    usually send them well after the clips, once they have seen the cuts. Can be
    re-submitted to correct a wrong link — the manifest re-reads it every sync.
    """
    await assert_client_role(user)
    batch = await _get_owned_active_batch(session, user, batch_id)

    if (batch.thumbnail_owner_kind or "") != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Thumbnails for this batch are produced by the Scale Brands Lab team",
            },
        )

    trimmed = url.strip()
    if not trimmed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "VALIDATION_ERROR", "message": "URL is required"},
        )
    if len(trimmed) > MAX_INTAKE_URL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": f"URL must be at most {MAX_INTAKE_URL_LENGTH} characters",
            },
        )

    batch.client_thumbnails_folder_url = trimmed
    session.add(batch)

    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="client_thumbnails_submitted",
        summary=f"Client sent a thumbnails folder for “{batch.title}”",
    )

    await session.flush()
    await session.refresh(batch)

    tickets_result = await session.execute(
        select(VideoTicket)
        .where(VideoTicket.batch_id == batch.id)
        .order_by(VideoTicket.deliverable_index.nullsfirst(), VideoTicket.created_at),
    )
    tickets = list(tickets_result.scalars().all())

    return SubmitBatchIntakeResponse(
        batch=batch_to_dto(batch),
        videos=[video_to_dto(ticket) for ticket in tickets],
    )


async def submit_client_intake(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
    intake_path: BatchIntakePath,
    url: str,
) -> SubmitBatchIntakeResponse:
    await assert_client_role(user)
    batch = await _get_owned_active_batch(session, user, batch_id)

    if batch.clip_review_phase is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "CONFLICT",
                "message": "Batch intake already submitted",
            },
        )

    trimmed = url.strip()
    if not trimmed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "URL is required",
            },
        )
    if len(trimmed) > MAX_INTAKE_URL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": f"URL must be at most {MAX_INTAKE_URL_LENGTH} characters",
            },
        )

    clips: list[dict] | None = None
    if intake_path == BatchIntakePath.clips_ready:
        try:
            clips = await drive_manifest_service.validate_clips_folder_for_intake(trimmed)
        except DriveManifestError as exc:
            client_error_codes = {
                "DRIVE_FOLDER_LINK_INVALID",
                "DRIVE_FOLDER_NOT_SHARED",
                "DRIVE_FOLDER_NO_VIDEOS",
            }
            raise HTTPException(
                status_code=(
                    status.HTTP_422_UNPROCESSABLE_ENTITY
                    if exc.code in client_error_codes
                    else status.HTTP_502_BAD_GATEWAY
                ),
                detail={"error_code": exc.code, "message": exc.message},
            ) from exc

    # Validation above must succeed before the existing batch state is touched.
    await session.execute(delete(VideoTicket).where(VideoTicket.batch_id == batch.id))

    if intake_path == BatchIntakePath.source_media:
        apply_source_media_intake(batch, trimmed)
        session.add(batch)
    elif intake_path == BatchIntakePath.clips_ready:
        validated_clips = clips or []
        apply_clips_ready_intake(batch, trimmed, len(validated_clips))
        session.add(batch)
        for clip in validated_clips:
            session.add(
                create_split_deliverable_ticket(
                    batch,
                    int(clip["index"]),
                    str(clip["name"]),
                )
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid intake path",
            },
        )

    kind = "raw footage" if intake_path == BatchIntakePath.source_media else "a clips folder"
    clip_summary = f" ({len(clips)} videos)" if clips is not None else ""
    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="intake_submitted",
        summary=f"Client submitted {kind}{clip_summary} for “{batch.title}”",
    )

    await session.flush()
    await session.refresh(batch)

    tickets_result = await session.execute(
        select(VideoTicket)
        .where(VideoTicket.batch_id == batch.id)
        .order_by(VideoTicket.deliverable_index.nullsfirst(), VideoTicket.created_at),
    )
    tickets = list(tickets_result.scalars().all())

    return SubmitBatchIntakeResponse(
        batch=batch_to_dto(batch),
        videos=[video_to_dto(ticket) for ticket in tickets],
    )
