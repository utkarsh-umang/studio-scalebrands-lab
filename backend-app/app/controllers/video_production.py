"""Per-ticket production commands (B6)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_roles
from app.db.session import get_db_session
from app.schemas.production import (
    DeliverableDriveSyncRequest,
    ProductionTicketResponse,
    SubmitToSmmQaResponse,
    UpdateProductionRequest,
)
from app.services import production_service

router = APIRouter(tags=["videos"])


@router.patch(
    "/videos/{video_ticket_id}/production",
    response_model=ProductionTicketResponse,
)
async def update_production(
    video_ticket_id: UUID,
    body: UpdateProductionRequest,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "editor", "smm")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductionTicketResponse:
    return await production_service.update_production(
        session,
        current_user,
        video_ticket_id,
        body,
    )


@router.post(
    "/videos/{video_ticket_id}/drive-sync",
    response_model=ProductionTicketResponse,
)
async def record_drive_sync(
    video_ticket_id: UUID,
    body: DeliverableDriveSyncRequest,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "editor", "smm")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductionTicketResponse:
    return await production_service.record_drive_sync(
        session,
        current_user,
        video_ticket_id,
        body,
    )


@router.post(
    "/videos/{video_ticket_id}/submit-to-smm-qa",
    response_model=SubmitToSmmQaResponse,
)
async def submit_to_smm_qa(
    video_ticket_id: UUID,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "editor", "smm")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SubmitToSmmQaResponse:
    return await production_service.submit_to_smm_qa(
        session,
        current_user,
        video_ticket_id,
    )
