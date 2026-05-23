"""Admin deadline task list and PATCH (B10)."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import BatchStatus
from app.models.user import User
from app.models.video_ticket import VideoTicket
from app.schemas.admin import (
    AdminDeadlineTaskResponse,
    AdminDeadlinesResponse,
    SetVideoDeadlineRequest,
    SetVideoDeadlineResponse,
)
from app.services.admin_pipeline_logic import list_admin_deadline_tasks
from app.services.workspace_mappers import video_to_dto


def _parse_deadline_at(value: str | None) -> datetime | None:
    if value is None:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    try:
        parsed = datetime.fromisoformat(trimmed.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid deadlineAt ISO datetime",
            },
        ) from exc
    if parsed.tzinfo is not None:
        return parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


async def get_deadlines(session: AsyncSession) -> AdminDeadlinesResponse:
    batch_result = await session.execute(select(Batch))
    batches = list(batch_result.scalars().all())

    video_result = await session.execute(select(VideoTicket))
    videos = list(video_result.scalars().all())

    profile_result = await session.execute(select(ClientProfile))
    profiles = list(profile_result.scalars().all())
    client_profiles = {profile.id: profile for profile in profiles}

    user_result = await session.execute(select(User))
    users = {user.id: user for user in user_result.scalars().all()}
    staff_names: dict[tuple[UUID, str], str] = {}
    for profile in profiles:
        if profile.assigned_smm_id and profile.assigned_smm_id in users:
            staff_names[(profile.assigned_smm_id, "smm")] = users[profile.assigned_smm_id].display_name
        if profile.assigned_editor_id and profile.assigned_editor_id in users:
            staff_names[(profile.assigned_editor_id, "editor")] = (
                users[profile.assigned_editor_id].display_name
            )

    tasks = list_admin_deadline_tasks(batches, videos, client_profiles, staff_names)
    return AdminDeadlinesResponse(
        tasks=[AdminDeadlineTaskResponse(**task) for task in tasks],
    )


async def set_video_deadline(
    session: AsyncSession,
    video_ticket_id: UUID,
    payload: SetVideoDeadlineRequest,
) -> SetVideoDeadlineResponse:
    ticket = await session.get(VideoTicket, video_ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Video {video_ticket_id} not found",
            },
        )

    batch = await session.get(Batch, ticket.batch_id)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Batch {ticket.batch_id} not found",
            },
        )

    if batch.status != BatchStatus.active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Deadlines can only be set on active batches",
            },
        )

    if ticket.deadline_role not in ("smm", "editor"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Ticket is not eligible for admin deadline editing",
            },
        )

    ticket.deadline_at = _parse_deadline_at(payload.deadline_at)
    session.add(ticket)
    await session.flush()
    await session.refresh(ticket)

    return SetVideoDeadlineResponse(ticket=video_to_dto(ticket))
