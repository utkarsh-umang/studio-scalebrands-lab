"""Editor deliverables drive split (B5)."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.models.batch import Batch
from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    BatchStatus,
    EmployeeKind,
    UserRole,
)
from app.models.qa_comment import QaComment
from app.models.video_ticket import VideoTicket
from app.schemas.clips import BatchVideosResponse
from app.schemas.deliverables import DeliverableTitleInput, SubmitDeliverablesDriveRequest
from app.services.activity_service import record_activity
from app.services.batch_command_response import build_batch_videos_response, load_batch_tickets
from app.services.path_b_transitions import (
    apply_deliverables_split,
    create_split_deliverable_ticket,
    default_deliverable_title,
    resolve_deliverable_count,
)
from app.services.workspace_access import assert_employee_batch_access

MAX_URL_LENGTH = 2048


def _batch_awaiting_clips(batch: Batch) -> bool:
    if batch.status != BatchStatus.active:
        return False
    if batch.intake_path == BatchIntakePath.clips_ready:
        return False
    return batch.clip_review_phase != BatchClipReviewPhase.approved


def _batch_ready_for_editor_work(batch: Batch) -> bool:
    if batch.status != BatchStatus.active:
        return False
    if batch.intake_path == BatchIntakePath.clips_ready:
        return bool((batch.clips_folder_url or "").strip())
    return batch.clip_review_phase == BatchClipReviewPhase.approved


def _titles_by_index(deliverables: list[DeliverableTitleInput] | None) -> dict[int, str]:
    if not deliverables:
        return {}
    titles: dict[int, str] = {}
    for item in deliverables:
        trimmed = item.title.strip()
        if item.index >= 1 and trimmed:
            titles[item.index] = trimmed
    return titles


async def submit_deliverables_drive(
    session: AsyncSession,
    user: CurrentUser,
    batch_id: UUID,
    payload: SubmitDeliverablesDriveRequest,
) -> BatchVideosResponse:
    if user.role != UserRole.employee or user.employee_kind != EmployeeKind.editor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Editor role required",
            },
        )

    await assert_employee_batch_access(session, user, batch_id)
    batch = await session.get(Batch, batch_id, with_for_update=True)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Batch {batch_id} not found",
            },
        )

    if batch.status != BatchStatus.active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is not active",
            },
        )

    if _batch_awaiting_clips(batch):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is awaiting client clip approval",
            },
        )

    if not _batch_ready_for_editor_work(batch):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is not ready for editor deliverables",
            },
        )

    if (batch.editor_deliverables_drive_url or "").strip():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "CONFLICT",
                "message": "Deliverables drive already submitted for this batch",
            },
        )

    trimmed_url = payload.deliverables_drive_url.strip()
    if not trimmed_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Deliverables drive URL is required",
            },
        )
    if len(trimmed_url) > MAX_URL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": f"URL must be at most {MAX_URL_LENGTH} characters",
            },
        )

    deliverables = payload.deliverables or []
    if payload.deliverable_count is not None and payload.deliverable_count < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "deliverableCount must be at least 1",
            },
        )

    n = resolve_deliverable_count(
        batch,
        deliverable_count=payload.deliverable_count,
        deliverables_length=len(deliverables),
    )
    titles_by_index = _titles_by_index(deliverables)

    ticket_ids_result = await session.execute(
        select(VideoTicket.id).where(VideoTicket.batch_id == batch.id),
    )
    ticket_ids = list(ticket_ids_result.scalars().all())
    if ticket_ids:
        await session.execute(
            delete(QaComment).where(QaComment.video_ticket_id.in_(ticket_ids)),
        )
        await session.execute(delete(VideoTicket).where(VideoTicket.batch_id == batch.id))

    apply_deliverables_split(batch, trimmed_url, n)
    session.add(batch)

    for index in range(1, n + 1):
        title = titles_by_index.get(index) or default_deliverable_title(index)
        session.add(create_split_deliverable_ticket(batch, index, title))

    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="deliverables_submitted",
        summary=f"Editor submitted deliverables — split “{batch.title}” into {n} video(s)",
    )

    await session.flush()
    await session.refresh(batch)
    tickets = await load_batch_tickets(session, batch.id)
    if len(tickets) != n:
        raise RuntimeError("Split ticket count mismatch after insert")
    return await build_batch_videos_response(session, batch)
