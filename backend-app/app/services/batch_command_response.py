"""Build batch + videos DTO responses after mutations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import Batch
from app.models.qa_comment import QaComment
from app.models.video_ticket import VideoTicket
from app.schemas.clips import BatchVideosResponse
from app.services.workspace_mappers import batch_to_dto, load_qa_comments_by_ticket_ids, video_to_dto


async def load_batch_tickets(session: AsyncSession, batch_id: UUID) -> list[VideoTicket]:
    result = await session.execute(
        select(VideoTicket)
        .where(VideoTicket.batch_id == batch_id)
        .order_by(VideoTicket.deliverable_index.nullsfirst(), VideoTicket.created_at),
    )
    return list(result.scalars().all())


async def build_batch_videos_response(
    session: AsyncSession,
    batch: Batch,
) -> BatchVideosResponse:
    tickets = await load_batch_tickets(session, batch.id)
    comments_by_ticket = await load_qa_comments_by_ticket_ids(
        session,
        [ticket.id for ticket in tickets],
    )
    return BatchVideosResponse(
        batch=batch_to_dto(batch),
        videos=[
            video_to_dto(ticket, qa_comments=comments_by_ticket.get(ticket.id, []))
            for ticket in tickets
        ],
    )
