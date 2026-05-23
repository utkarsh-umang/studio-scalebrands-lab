"""Per-ticket production commands (B6)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, require_roles
from app.db.session import get_db_session
from app.schemas.production import (
    DeliverableDriveSyncRequest,
    ProductionTicketResponse,
    SubmitToSmmQaResponse,
    UpdateProductionRequest,
)
from app.schemas.schedule import ScheduleVideoRequest, ScheduleVideoResponse
from app.schemas.qa import (
    AppendQaCommentRequest,
    AppendQaCommentResponse,
    ClientRevisionTriageRequest,
    QaTicketResponse,
    ResubmitToSmmQaRequest,
    SubmitSmmQaRequest,
)
from app.services import production_service, qa_service, schedule_service

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


@router.post(
    "/videos/{video_ticket_id}/smm-qa",
    response_model=QaTicketResponse,
)
async def submit_smm_qa_review(
    video_ticket_id: UUID,
    body: SubmitSmmQaRequest,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "smm")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> QaTicketResponse:
    return await qa_service.submit_smm_qa_review(
        session,
        current_user,
        video_ticket_id,
        body,
    )


@router.post(
    "/videos/{video_ticket_id}/qa-comments",
    response_model=AppendQaCommentResponse,
)
async def append_qa_comment(
    video_ticket_id: UUID,
    body: AppendQaCommentRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AppendQaCommentResponse:
    return await qa_service.append_qa_comment(
        session,
        current_user,
        video_ticket_id,
        body,
    )


@router.post(
    "/videos/{video_ticket_id}/client-revision-triage",
    response_model=QaTicketResponse,
)
async def triage_client_revision(
    video_ticket_id: UUID,
    body: ClientRevisionTriageRequest,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "smm")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> QaTicketResponse:
    return await qa_service.triage_client_revision(
        session,
        current_user,
        video_ticket_id,
        body,
    )


@router.post(
    "/videos/{video_ticket_id}/schedule",
    response_model=ScheduleVideoResponse,
)
async def schedule_video(
    video_ticket_id: UUID,
    body: ScheduleVideoRequest,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "smm")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ScheduleVideoResponse:
    return await schedule_service.schedule_video(
        session,
        current_user,
        video_ticket_id,
        body,
    )


@router.post(
    "/videos/{video_ticket_id}/resubmit-to-smm-qa",
    response_model=QaTicketResponse,
)
async def resubmit_to_smm_qa(
    video_ticket_id: UUID,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles("employee", "editor")),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    body: ResubmitToSmmQaRequest = ResubmitToSmmQaRequest(),
) -> QaTicketResponse:
    return await qa_service.resubmit_editor_video(
        session,
        current_user,
        video_ticket_id,
        body,
    )
