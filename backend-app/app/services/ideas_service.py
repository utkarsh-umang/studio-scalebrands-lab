"""Path A (idea-first): request ideas → SMM research → client review → footage.

Ideas are an approval gate: once approved and footage arrives, the batch joins
the shared Path B production flow (no clip review). A single gate ticket carries
the owner through the idea stages, then becomes the editor pre-split gate.
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.models.batch import Batch
from app.models.enums import BatchStatus, PipelineStage
from app.models.video_ticket import VideoTicket
from app.schemas.clips import BatchVideosResponse
from app.services.activity_service import record_activity
from app.services.batch_command_response import build_batch_videos_response, load_batch_tickets
from app.services.path_b_transitions import (
    IDEA_GATE_TITLE,
    apply_approve_ideas,
    apply_reject_ideas,
    apply_request_ideas,
    apply_submit_idea_footage,
    apply_submit_ideas,
    apply_video_transition,
    create_idea_gate_ticket,
)
from app.services.workspace_access import assert_client_role, assert_employee_batch_access

MAX_IDEAS = 20
MAX_IDEA_LEN = 500
MAX_URL_LENGTH = 2048


def _validation_error(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"error_code": "VALIDATION_ERROR", "message": message},
    )


async def _client_batch(session: AsyncSession, user: CurrentUser, batch_id: UUID) -> Batch:
    profile_id = await assert_client_role(user)
    batch = await session.get(Batch, batch_id)
    if batch is None or batch.client_id != profile_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": f"Batch {batch_id} not found"},
        )
    if batch.status != BatchStatus.active:
        raise _validation_error("Batch is not active")
    return batch


def _assert_stage(batch: Batch, expected: PipelineStage) -> None:
    if batch.pipeline_stage != expected:
        raise _validation_error(f"Batch is not awaiting {expected.value.replace('_', ' ')}")


async def _transition_gate(
    session: AsyncSession, batch: Batch, stage: PipelineStage, *, title: str | None = None
) -> None:
    for ticket in await load_batch_tickets(session, batch.id):
        if ticket.deliverable_index is None:
            apply_video_transition(ticket, stage, title=title)
            session.add(ticket)
            return


async def request_ideas(
    session: AsyncSession, user: CurrentUser, batch_id: UUID
) -> BatchVideosResponse:
    batch = await _client_batch(session, user, batch_id)
    if batch.pipeline_stage != PipelineStage.intake_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "CONFLICT", "message": "Batch intake already started"},
        )
    await session.execute(delete(VideoTicket).where(VideoTicket.batch_id == batch.id))
    apply_request_ideas(batch)
    session.add(batch)
    session.add(create_idea_gate_ticket(batch))
    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="ideas_requested",
        summary=f"Client requested video ideas for “{batch.title}”",
    )
    await session.flush()
    await session.refresh(batch)
    return await build_batch_videos_response(session, batch)


async def submit_ideas(
    session: AsyncSession, user: CurrentUser, batch_id: UUID, ideas: list[str]
) -> BatchVideosResponse:
    batch = await assert_employee_batch_access(session, user, batch_id)
    _assert_stage(batch, PipelineStage.idea_research)
    cleaned = [i.strip()[:MAX_IDEA_LEN] for i in ideas if i.strip()][:MAX_IDEAS]
    if not cleaned:
        raise _validation_error("At least one idea is required")
    apply_submit_ideas(batch, cleaned)
    session.add(batch)
    await _transition_gate(session, batch, PipelineStage.idea_review, title="Idea approval")
    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="ideas_submitted",
        summary=f"SMM submitted {len(cleaned)} idea(s) for review — “{batch.title}”",
    )
    await session.flush()
    await session.refresh(batch)
    return await build_batch_videos_response(session, batch)


async def approve_ideas(
    session: AsyncSession, user: CurrentUser, batch_id: UUID
) -> BatchVideosResponse:
    batch = await _client_batch(session, user, batch_id)
    _assert_stage(batch, PipelineStage.idea_review)
    apply_approve_ideas(batch)
    session.add(batch)
    await _transition_gate(session, batch, PipelineStage.idea_footage_pending, title="Send footage")
    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="ideas_approved",
        summary=f"Client approved the idea list for “{batch.title}”",
    )
    await session.flush()
    await session.refresh(batch)
    return await build_batch_videos_response(session, batch)


async def reject_ideas(
    session: AsyncSession, user: CurrentUser, batch_id: UUID, note: str | None
) -> BatchVideosResponse:
    batch = await _client_batch(session, user, batch_id)
    _assert_stage(batch, PipelineStage.idea_review)
    apply_reject_ideas(batch)
    session.add(batch)
    await _transition_gate(session, batch, PipelineStage.idea_research, title=IDEA_GATE_TITLE)
    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="ideas_rejected",
        summary=f"Client asked for different ideas — “{batch.title}”",
        detail=(note or "").strip() or None,
    )
    await session.flush()
    await session.refresh(batch)
    return await build_batch_videos_response(session, batch)


async def submit_idea_footage(
    session: AsyncSession, user: CurrentUser, batch_id: UUID, url: str
) -> BatchVideosResponse:
    batch = await _client_batch(session, user, batch_id)
    _assert_stage(batch, PipelineStage.idea_footage_pending)
    trimmed = url.strip()
    if not trimmed:
        raise _validation_error("Footage URL is required")
    if len(trimmed) > MAX_URL_LENGTH:
        raise _validation_error(f"URL must be at most {MAX_URL_LENGTH} characters")
    apply_submit_idea_footage(batch, trimmed)
    session.add(batch)
    await _transition_gate(
        session, batch, PipelineStage.pre_split_production, title=f"Batch — {batch.title}"
    )
    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="idea_footage_submitted",
        summary=f"Client sent footage for “{batch.title}” — ready for production",
    )
    await session.flush()
    await session.refresh(batch)
    return await build_batch_videos_response(session, batch)
