"""Per-video scheduling and batch completion + credit debit (B9)."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import utc_now
from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.credit_adjustment import CreditAdjustment
from app.models.enums import (
    BatchStatus,
    EmployeeKind,
    PipelineStage,
    UserRole,
    VideoPipelineOwner,
)
from app.models.video_ticket import VideoTicket
from app.schemas.schedule import (
    ALLOWED_SCHEDULE_PLATFORMS,
    ScheduleVideoClientResponse,
    ScheduleVideoRequest,
    ScheduleVideoResponse,
)
from app.services.path_b_transitions import apply_video_transition, is_clip_review_gate_ticket
from app.services.workspace_access import assert_employee_batch_access, assert_video_access
from app.services.workspace_mappers import batch_to_dto, video_to_dto


def _assert_smm_user(user: CurrentUser) -> None:
    if user.role != UserRole.employee or user.employee_kind != EmployeeKind.smm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "SMM role required",
            },
        )


def _parse_go_live_at(go_live_date: str, go_live_time: str) -> datetime:
    trimmed_date = go_live_date.strip()
    trimmed_time = go_live_time.strip()
    if not trimmed_date or not trimmed_time:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "goLiveDate and goLiveTime are required",
            },
        )
    time_value = trimmed_time if len(trimmed_time.split(":")) == 3 else f"{trimmed_time}:00"
    try:
        parsed = datetime.fromisoformat(f"{trimmed_date}T{time_value}")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid goLiveDate or goLiveTime",
            },
        ) from exc
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _assert_schedulable_ticket(ticket: VideoTicket, batch: Batch) -> None:
    if is_clip_review_gate_ticket(ticket):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Gate tickets cannot be scheduled",
            },
        )
    if ticket.deliverable_index is None or ticket.deliverable_index < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Scheduling requires a post-split deliverable ticket",
            },
        )
    if batch.status != BatchStatus.active or batch.credits_debited:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch is already completed",
            },
        )
    if (
        ticket.pipeline_stage != PipelineStage.scheduling
        or ticket.pipeline_owner != VideoPipelineOwner.scheduling
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Ticket is not awaiting scheduling",
            },
        )


async def _all_deliverables_done(session: AsyncSession, batch_id: UUID) -> bool:
    result = await session.execute(
        select(VideoTicket).where(
            VideoTicket.batch_id == batch_id,
            VideoTicket.deliverable_index.is_not(None),
            VideoTicket.deliverable_index > 0,
        ),
    )
    deliverables = list(result.scalars().all())
    return len(deliverables) > 0 and all(
        ticket.pipeline_owner == VideoPipelineOwner.done for ticket in deliverables
    )


async def schedule_video(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: ScheduleVideoRequest,
) -> ScheduleVideoResponse:
    _assert_smm_user(user)
    ticket = await assert_video_access(session, user, video_ticket_id)
    await assert_employee_batch_access(session, user, ticket.batch_id)

    platform = payload.platform.strip()
    if platform not in ALLOWED_SCHEDULE_PLATFORMS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid platform",
            },
        )

    go_live_at = _parse_go_live_at(payload.go_live_date, payload.go_live_time)
    scheduled_at = utc_now()

    batch_result = await session.execute(
        select(Batch).where(Batch.id == ticket.batch_id).with_for_update(),
    )
    batch = batch_result.scalar_one_or_none()
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Batch {ticket.batch_id} not found",
            },
        )

    ticket = await session.get(VideoTicket, video_ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Video {video_ticket_id} not found",
            },
        )

    _assert_schedulable_ticket(ticket, batch)

    apply_video_transition(
        ticket,
        PipelineStage.completed,
        released_to_client_final_review=False,
    )
    ticket.video_schedule = {
        "platform": platform,
        "goLiveAt": go_live_at.isoformat(),
        "scheduledAt": scheduled_at.isoformat(),
    }
    ticket.updated_at = utc_now()
    session.add(ticket)

    client_snapshot: ScheduleVideoClientResponse | None = None

    if await _all_deliverables_done(session, batch.id):
        if not batch.credits_debited:
            profile = await session.get(ClientProfile, batch.client_id)
            if profile is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error_code": "NOT_FOUND",
                        "message": f"Client {batch.client_id} not found",
                    },
                )
            batch.status = BatchStatus.completed
            batch.pipeline_stage = PipelineStage.completed
            batch.credits_debited = True
            batch.completed_at = scheduled_at
            batch.batch_schedule = {
                "platform": platform,
                "goLiveAt": go_live_at.isoformat(),
                "completedAt": scheduled_at.date().isoformat(),
            }
            profile.credits_balance = max(0, profile.credits_balance - batch.credit_cost)
            profile.updated_at = scheduled_at
            session.add(profile)
            session.add(
                CreditAdjustment(
                    client_id=profile.id,
                    batch_id=batch.id,
                    amount=-batch.credit_cost,
                    kind="debit_batch",
                    created_by_user_id=user.id,
                ),
            )
            client_snapshot = ScheduleVideoClientResponse(
                id=profile.id,
                credits=profile.credits_balance,
            )
    else:
        batch.updated_at = scheduled_at

    session.add(batch)
    await session.flush()
    await session.refresh(ticket)
    await session.refresh(batch)

    return ScheduleVideoResponse(
        ticket=video_to_dto(ticket),
        batch=batch_to_dto(batch),
        client=client_snapshot,
    )
