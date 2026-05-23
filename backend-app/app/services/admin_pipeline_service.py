"""Admin pipeline overview aggregation."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.video_ticket import VideoTicket
from app.schemas.admin import (
    AdminPipelineItemResponse,
    AdminPipelineResponse,
    AdminPipelineSummaryResponse,
)
from app.services.admin_pipeline_logic import (
    compute_pipeline_summary,
    list_pipeline_items,
)


async def get_pipeline(session: AsyncSession) -> AdminPipelineResponse:
    batch_result = await session.execute(select(Batch))
    batches = list(batch_result.scalars().all())

    video_result = await session.execute(select(VideoTicket))
    videos = list(video_result.scalars().all())
    videos_by_batch: dict = {}
    for video in videos:
        videos_by_batch.setdefault(video.batch_id, []).append(video)

    profile_result = await session.execute(select(ClientProfile))
    client_names = {
        profile.id: profile.display_name for profile in profile_result.scalars().all()
    }

    summary = compute_pipeline_summary(batches, videos_by_batch)
    items = list_pipeline_items(batches, videos_by_batch, client_names)

    return AdminPipelineResponse(
        summary=AdminPipelineSummaryResponse(**summary),
        items=[AdminPipelineItemResponse(**item) for item in items],
    )
