"""Client final QA commands (B8)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_roles
from app.db.session import get_db_session
from app.schemas.production import ProductionTicketResponse, SetClientTitleRequest
from app.schemas.qa import ClientQaRequest, QaTicketResponse
from app.services import production_service, qa_service

router = APIRouter(prefix="/client", tags=["client"])


@router.post(
    "/videos/{video_ticket_id}/title",
    response_model=ProductionTicketResponse,
)
async def set_client_title(
    video_ticket_id: UUID,
    body: SetClientTitleRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles("client"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductionTicketResponse:
    return await production_service.set_client_title(
        session,
        current_user,
        video_ticket_id,
        body.title,
    )


@router.post(
    "/videos/{video_ticket_id}/client-qa",
    response_model=QaTicketResponse,
)
async def submit_client_qa(
    video_ticket_id: UUID,
    body: ClientQaRequest,
    current_user: Annotated[CurrentUser, Depends(require_roles("client"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> QaTicketResponse:
    return await qa_service.submit_client_qa(
        session,
        current_user,
        video_ticket_id,
        body,
    )
