"""Client batch intake (B3)."""

from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.models.batch import Batch
from app.models.enums import (
    BatchIntakePath,
    BatchStatus,
    MediaAssetKind,
    MediaAssetStatus,
    PipelineStage,
    UserRole,
)
from app.models.media_asset import MediaAsset
from app.models.video_ticket import VideoTicket
from app.schemas.intake import (
    PreparedSourceClipUpload,
    PrepareSourceClipsResponse,
    SourceClipFileInput,
    SubmitBatchIntakeResponse,
)
from app.schemas.media import InitiateMediaUploadRequest
from app.services import drive_manifest_service, media_service
from app.services.activity_service import record_activity
from app.services.admin_helpers import assert_client_active, get_profile_or_404
from app.services.drive_manifest_service import DriveManifestError
from app.services.path_b_transitions import (
    apply_clips_ready_intake,
    apply_source_media_intake,
    apply_uploaded_clips_intake,
    apply_video_transition,
    create_split_deliverable_ticket,
)
from app.services.workspace_access import assert_client_role
from app.services.workspace_mappers import batch_to_dto, video_to_dto

MAX_INTAKE_URL_LENGTH = 2048
MAX_SOURCE_CLIPS = 100


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


def _assert_direct_upload_open(batch: Batch) -> None:
    if (
        batch.pipeline_stage != PipelineStage.intake_pending
        or batch.clip_review_phase is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "CONFLICT",
                "message": "This batch has already moved past client upload.",
            },
        )


async def prepare_source_clip_uploads(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
    files: list[SourceClipFileInput],
) -> PrepareSourceClipsResponse:
    """Create one draft production ticket and presigned S3 upload per client clip."""
    await assert_client_role(user)
    batch = await _get_owned_active_batch(session, user, batch_id)
    _assert_direct_upload_open(batch)

    if not files or len(files) > MAX_SOURCE_CLIPS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "UPLOAD_COUNT_INVALID",
                "message": f"Choose between 1 and {MAX_SOURCE_CLIPS} video clips.",
            },
        )

    existing_assets = list(
        (
            await session.execute(
                select(MediaAsset).where(MediaAsset.batch_id == batch.id)
            )
        ).scalars().all()
    )
    if any(asset.kind != MediaAssetKind.source_clip for asset in existing_assets):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "CONFLICT",
                "message": "This batch already contains production media.",
            },
        )

    # A refreshed browser cannot retain local File handles. Starting again while
    # intake is still open safely replaces the previous draft upload manifest.
    await session.execute(
        delete(MediaAsset).where(
            MediaAsset.batch_id == batch.id,
            MediaAsset.kind == MediaAssetKind.source_clip,
        )
    )
    await session.execute(delete(VideoTicket).where(VideoTicket.batch_id == batch.id))
    await session.flush()

    tickets: list[VideoTicket] = []
    for index, source_file in enumerate(files, start=1):
        title = Path(source_file.filename.strip()).stem.strip()[:512]
        ticket = VideoTicket(
            batch_id=batch.id,
            client_id=batch.client_id,
            title=title or f"Clip {index}",
            deliverable_index=index,
            pipeline_stage=PipelineStage.intake_pending,
            stage_label="Uploading source clip",
        )
        session.add(ticket)
        tickets.append(ticket)
    await session.flush()

    prepared: list[PreparedSourceClipUpload] = []
    for ticket, source_file in zip(tickets, files, strict=True):
        initiated = await media_service.initiate_upload(
            session,
            user,
            ticket.id,
            InitiateMediaUploadRequest(
                kind=MediaAssetKind.source_clip,
                filename=source_file.filename,
                content_type=source_file.content_type,
                size_bytes=source_file.size_bytes,
            ),
        )
        prepared.append(
            PreparedSourceClipUpload(
                video_ticket_id=ticket.id,
                deliverable_index=ticket.deliverable_index or 0,
                filename=source_file.filename,
                upload=initiated,
            )
        )

    return PrepareSourceClipsResponse(uploads=prepared)


async def finalize_source_clip_uploads(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
) -> SubmitBatchIntakeResponse:
    """Publish the uploaded clip manifest to the editor only when every object is ready."""
    await assert_client_role(user)
    batch = await _get_owned_active_batch(session, user, batch_id)
    _assert_direct_upload_open(batch)

    tickets = list(
        (
            await session.execute(
                select(VideoTicket)
                .where(
                    VideoTicket.batch_id == batch.id,
                    VideoTicket.deliverable_index.is_not(None),
                )
                .order_by(VideoTicket.deliverable_index)
            )
        ).scalars().all()
    )
    if not tickets:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "UPLOADS_NOT_READY",
                "message": "Choose and upload at least one video clip first.",
            },
        )

    ready_ticket_ids = set(
        (
            await session.execute(
                select(MediaAsset.video_ticket_id).where(
                    MediaAsset.batch_id == batch.id,
                    MediaAsset.kind == MediaAssetKind.source_clip,
                    MediaAsset.status == MediaAssetStatus.ready,
                    MediaAsset.is_current.is_(True),
                )
            )
        ).scalars().all()
    )
    missing = [ticket for ticket in tickets if ticket.id not in ready_ticket_ids]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "UPLOADS_NOT_READY",
                "message": f"{len(missing)} clip upload(s) are not complete yet.",
            },
        )

    apply_uploaded_clips_intake(batch, len(tickets))
    session.add(batch)
    for ticket in tickets:
        apply_video_transition(ticket, PipelineStage.production)
        session.add(ticket)

    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="source_clips_uploaded",
        summary=f"Client uploaded {len(tickets)} source clips for “{batch.title}”",
    )
    await session.flush()
    await session.refresh(batch)

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
