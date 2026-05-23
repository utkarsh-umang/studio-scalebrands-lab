"""Editor batch commands (B5)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_roles
from app.db.session import get_db_session
from app.schemas.deliverables import (
    SubmitDeliverablesDriveRequest,
    SubmitDeliverablesDriveResponse,
)
from app.services import deliverables_split_service

router = APIRouter(prefix="/editor", tags=["editor"])


@router.post(
    "/batches/{batch_id}/deliverables-drive",
    response_model=SubmitDeliverablesDriveResponse,
)
async def submit_deliverables_drive(
    batch_id: UUID,
    body: SubmitDeliverablesDriveRequest,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "editor")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SubmitDeliverablesDriveResponse:
    return await deliverables_split_service.submit_deliverables_drive(
        session,
        current_user,
        batch_id,
        body,
    )
