"""Path A (idea-first) intake endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_roles
from app.db.session import get_db_session
from app.schemas.ideas import (
    IdeasResponse,
    RejectIdeasRequest,
    SubmitIdeaFootageRequest,
    SubmitIdeasRequest,
)
from app.services import ideas_service

router = APIRouter(tags=["ideas"])

ClientUser = Annotated[CurrentUser, Depends(require_roles("client"))]
SmmUser = Annotated[CurrentUser, Depends(require_roles("employee", "smm"))]
Session = Annotated[AsyncSession, Depends(get_db_session)]


@router.post("/client/batches/{batch_id}/request-ideas", response_model=IdeasResponse)
async def request_ideas(batch_id: UUID, user: ClientUser, session: Session) -> IdeasResponse:
    return await ideas_service.request_ideas(session, user, batch_id)


@router.post("/batches/{batch_id}/ideas", response_model=IdeasResponse)
async def submit_ideas(
    batch_id: UUID, body: SubmitIdeasRequest, user: SmmUser, session: Session
) -> IdeasResponse:
    return await ideas_service.submit_ideas(session, user, batch_id, body.ideas)


@router.post("/client/batches/{batch_id}/ideas/approve", response_model=IdeasResponse)
async def approve_ideas(batch_id: UUID, user: ClientUser, session: Session) -> IdeasResponse:
    return await ideas_service.approve_ideas(session, user, batch_id)


@router.post("/client/batches/{batch_id}/ideas/reject", response_model=IdeasResponse)
async def reject_ideas(
    batch_id: UUID, body: RejectIdeasRequest, user: ClientUser, session: Session
) -> IdeasResponse:
    return await ideas_service.reject_ideas(session, user, batch_id, body.note)


@router.post("/client/batches/{batch_id}/idea-footage", response_model=IdeasResponse)
async def submit_idea_footage(
    batch_id: UUID, body: SubmitIdeaFootageRequest, user: ClientUser, session: Session
) -> IdeasResponse:
    return await ideas_service.submit_idea_footage(session, user, batch_id, body.url)
