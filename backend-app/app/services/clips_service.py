"""SMM/Editor clips folder and client clip review (B4)."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.models.batch import Batch
from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    BatchStatus,
    PipelineStage,
    QaCommentKind,
    QaMediaSlot,
    UserRole,
)
from app.models.qa_comment import QaComment
from app.models.video_ticket import VideoTicket
from app.schemas.clips import BatchVideosResponse
from app.services.activity_service import record_activity
from app.services.admin_helpers import assert_client_active, get_profile_or_404
from app.services.batch_command_response import build_batch_videos_response, load_batch_tickets
from app.services.path_b_transitions import (
    CLIP_REVIEW_GATE_TITLE,
    apply_approve_clips,
    apply_reject_clips,
    apply_submit_clips_folder,
    apply_video_transition,
    create_clip_review_gate_ticket,
    is_clip_identification_ticket,
    is_clip_review_gate_ticket,
    is_pre_split_gate_or_clip_review,
)
from app.services.workspace_access import assert_client_role, assert_employee_batch_access

MAX_URL_LENGTH = 2048

_SUBMIT_ALLOWED_PHASES = {
    BatchClipReviewPhase.smm_identifying,
    BatchClipReviewPhase.with_smm,
    BatchClipReviewPhase.awaiting_client,
    None,
}


def _assert_source_media_batch(batch: Batch) -> None:
    if batch.intake_path != BatchIntakePath.source_media:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Clip review does not apply to clips-ready batches",
            },
        )


def _assert_active_batch(batch: Batch) -> None:
    if batch.status != BatchStatus.active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is not active",
            },
        )


async def _get_owned_client_batch(
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
    _assert_active_batch(batch)
    return batch


def _clip_asset_version(ticket: VideoTicket) -> int:
    if ticket.asset_versions and isinstance(ticket.asset_versions, dict):
        clip_version = ticket.asset_versions.get("clip")
        if isinstance(clip_version, int) and clip_version > 0:
            return clip_version
    return 1


async def submit_clips_folder(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
    clips_folder_url: str,
) -> BatchVideosResponse:
    batch = await assert_employee_batch_access(session, user, batch_id)
    _assert_active_batch(batch)
    _assert_source_media_batch(batch)

    trimmed = clips_folder_url.strip()
    if not trimmed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Clips folder URL is required",
            },
        )
    if len(trimmed) > MAX_URL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": f"URL must be at most {MAX_URL_LENGTH} characters",
            },
        )

    source_url = (batch.source_media_url or "").strip()
    if not source_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Client must submit source media before clips folder",
            },
        )

    if batch.clip_review_phase == BatchClipReviewPhase.approved:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Clip review is already approved",
            },
        )

    if batch.clip_review_phase not in _SUBMIT_ALLOWED_PHASES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is not ready for clips folder submission",
            },
        )

    apply_submit_clips_folder(batch, trimmed)
    session.add(batch)

    tickets = await load_batch_tickets(session, batch.id)
    has_clip_review = False
    for ticket in tickets:
        if is_clip_identification_ticket(ticket):
            apply_video_transition(
                ticket,
                PipelineStage.clip_client_review,
                title=CLIP_REVIEW_GATE_TITLE,
            )
            session.add(ticket)
        if is_clip_review_gate_ticket(ticket):
            has_clip_review = True

    if not has_clip_review:
        session.add(create_clip_review_gate_ticket(batch))

    await session.flush()
    await session.refresh(batch)
    return await build_batch_videos_response(session, batch)


async def approve_batch_clips(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
    video_ticket_id: UUID,
    clip_count: int | None = None,
) -> BatchVideosResponse:
    await assert_client_role(user)
    batch = await _get_owned_client_batch(session, user, batch_id)
    _assert_source_media_batch(batch)

    if batch.clip_review_phase != BatchClipReviewPhase.awaiting_client:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is not awaiting client clip review",
            },
        )

    if not (batch.clips_folder_url or "").strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Clips folder URL is required",
            },
        )

    if clip_count is not None and clip_count < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "clipCount must be zero or greater",
            },
        )

    ticket = await session.get(VideoTicket, video_ticket_id)
    if ticket is None or ticket.batch_id != batch.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Video {video_ticket_id} not found",
            },
        )

    if not is_clip_review_gate_ticket(ticket):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Video ticket is not a clip review gate",
            },
        )

    apply_approve_clips(batch, clip_count=clip_count)
    session.add(batch)

    tickets = await load_batch_tickets(session, batch.id)
    for row in tickets:
        if row.id == ticket.id or is_pre_split_gate_or_clip_review(row):
            apply_video_transition(row, PipelineStage.pre_split_production)
            session.add(row)

    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="clips_approved",
        summary=f"Approved clips for “{batch.title}”",
        video_ticket_id=ticket.id,
    )

    await session.flush()
    await session.refresh(batch)
    return await build_batch_videos_response(session, batch)


async def reject_batch_clips(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
    video_ticket_id: UUID,
    note: str,
) -> BatchVideosResponse:
    await assert_client_role(user)
    batch = await _get_owned_client_batch(session, user, batch_id)
    _assert_source_media_batch(batch)

    if batch.clip_review_phase != BatchClipReviewPhase.awaiting_client:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is not awaiting client clip review",
            },
        )

    trimmed_note = note.strip()
    if not trimmed_note:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Rejection note is required",
            },
        )

    ticket = await session.get(VideoTicket, video_ticket_id)
    if ticket is None or ticket.batch_id != batch.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Video {video_ticket_id} not found",
            },
        )

    if not is_clip_review_gate_ticket(ticket):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Video ticket is not a clip review gate",
            },
        )

    apply_reject_clips(batch)
    session.add(batch)

    apply_video_transition(ticket, PipelineStage.clips_identifying)
    session.add(ticket)

    session.add(
        QaComment(
            video_ticket_id=ticket.id,
            slot=QaMediaSlot.clip,
            asset_version=_clip_asset_version(ticket),
            kind=QaCommentKind.clip_note,
            author_role="client",
            author_user_id=user.id,
            body=trimmed_note,
            deprecated=False,
        ),
    )

    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="clips_rejected",
        summary=f"Rejected clips for “{batch.title}”",
        video_ticket_id=ticket.id,
        detail=trimmed_note,
    )

    await session.flush()
    await session.refresh(batch)
    return await build_batch_videos_response(session, batch)
