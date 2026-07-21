"""Admin batch folder creation and reads."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import utc_now
from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import BatchStatus, PipelineStage
from app.models.video_ticket import VideoTicket
from app.schemas.admin import (
    AdminBatchFolderResponse,
    CreateBatchRequest,
    SetBatchAssignmentsRequest,
)
from app.services.admin_helpers import assert_client_active, get_profile_or_404
from app.services.admin_mappers import batch_to_response, video_to_response

# Who owns a shared step. "client" covers clients who supply their own
# thumbnails/titles rather than having the team produce them.
_OWNER_KINDS = {"smm", "editor", "client"}


def _validate_owner_kind(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    if normalized not in _OWNER_KINDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Owner must be 'smm', 'editor', or 'client'",
            },
        )
    return normalized


async def list_batches_for_client(
    session: AsyncSession,
    client_id: UUID,
) -> list[AdminBatchFolderResponse]:
    await get_profile_or_404(session, client_id)
    result = await session.execute(
        select(Batch)
        .where(Batch.client_id == client_id)
        .order_by(Batch.batch_number.desc()),
    )
    return [batch_to_response(batch) for batch in result.scalars().all()]


async def list_videos_for_batch(
    session: AsyncSession,
    client_id: UUID,
    batch_id: UUID,
) -> list:
    await get_profile_or_404(session, client_id)
    batch = await session.get(Batch, batch_id)
    if batch is None or batch.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Batch {batch_id} not found",
            },
        )
    result = await session.execute(
        select(VideoTicket)
        .where(VideoTicket.batch_id == batch_id)
        .order_by(VideoTicket.deliverable_index.nullsfirst(), VideoTicket.created_at),
    )
    return [video_to_response(ticket) for ticket in result.scalars().all()]


async def create_batch(
    session: AsyncSession,
    client_id: UUID,
    body: CreateBatchRequest,
) -> AdminBatchFolderResponse:
    profile = await get_profile_or_404(session, client_id)
    await assert_client_active(profile)

    locked = await session.get(ClientProfile, client_id, with_for_update=True)
    if locked is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": f"Client {client_id} not found"},
        )

    result = await session.execute(
        select(func.coalesce(func.max(Batch.batch_number), 0)).where(
            Batch.client_id == client_id,
        ),
    )
    next_number = int(result.scalar_one()) + 1
    footage = body.footage_url.strip() if body.footage_url else None

    batch = Batch(
        client_id=client_id,
        batch_number=next_number,
        title=body.title.strip(),
        status=BatchStatus.active,
        pipeline_stage=PipelineStage.intake_pending,
        video_count=0,
        source_media_url=footage,
        credit_cost=body.credit_cost,
        credits_debited=False,
    )
    session.add(batch)
    await session.flush()
    await session.refresh(batch)
    return batch_to_response(batch)


async def set_batch_assignments(
    session: AsyncSession,
    batch_id: UUID,
    body: SetBatchAssignmentsRequest,
) -> AdminBatchFolderResponse:
    """Set which shared team member (smm | editor) owns each shared step.

    Full replace: an omitted / null field clears that assignment.
    """
    batch = await session.get(Batch, batch_id)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": f"Batch {batch_id} not found"},
        )
    batch.clip_owner_kind = _validate_owner_kind(body.clip_owner_kind)
    batch.thumbnail_owner_kind = _validate_owner_kind(body.thumbnail_owner_kind)
    batch.title_owner_kind = _validate_owner_kind(body.title_owner_kind)
    batch.updated_at = utc_now()
    session.add(batch)
    await session.flush()
    await session.refresh(batch)
    return batch_to_response(batch)
