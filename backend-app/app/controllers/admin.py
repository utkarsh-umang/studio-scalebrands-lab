"""Admin endpoints (B1)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_roles
from app.db.session import get_db_session
from app.schemas.admin import (
    AdminBatchFolderResponse,
    AdminClientListResponse,
    AdminClientProfileResponse,
    AdminDeadlinesResponse,
    AdminPipelineResponse,
    AdminVideoTicketResponse,
    CreateBatchRequest,
    DecommissionClientRequest,
    ProvisionClientRequest,
    ProvisionClientResponse,
    ProvisionStaffRequest,
    ProvisionStaffResponse,
    SetBatchAssignmentsRequest,
    SetVideoDeadlineRequest,
    SetVideoDeadlineResponse,
    StaffListResponse,
    TopUpCreditsRequest,
    UpdateBrandGuidelinesRequest,
    UpdateClientTeamRequest,
)
from app.services import (
    admin_batches_service,
    admin_clients_service,
    admin_deadlines_service,
    admin_pipeline_service,
    admin_staff_service,
)

router = APIRouter(prefix="/admin", tags=["admin"])

AdminUser = Annotated[CurrentUser, Depends(require_roles("admin"))]


@router.get("/clients", response_model=AdminClientListResponse)
async def list_clients(
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminClientListResponse:
    return await admin_clients_service.list_clients(session)


@router.post("/clients", response_model=ProvisionClientResponse)
async def provision_client(
    body: ProvisionClientRequest,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProvisionClientResponse:
    return await admin_clients_service.provision_client(session, body)


@router.get("/clients/{client_id}", response_model=AdminClientProfileResponse)
async def get_client(
    client_id: UUID,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminClientProfileResponse:
    return await admin_clients_service.get_client(session, client_id)


@router.post("/clients/{client_id}/credits/top-up", response_model=AdminClientProfileResponse)
async def top_up_credits(
    client_id: UUID,
    body: TopUpCreditsRequest,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminClientProfileResponse:
    return await admin_clients_service.top_up_credits(session, client_id, body, admin)


@router.post("/clients/{client_id}/decommission", response_model=AdminClientProfileResponse)
async def decommission_client(
    client_id: UUID,
    body: DecommissionClientRequest,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminClientProfileResponse:
    return await admin_clients_service.decommission_client(session, client_id, body)


@router.patch("/clients/{client_id}/team", response_model=AdminClientProfileResponse)
async def update_client_team(
    client_id: UUID,
    body: UpdateClientTeamRequest,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminClientProfileResponse:
    return await admin_clients_service.update_team(session, client_id, body)


@router.patch("/clients/{client_id}/brand-guidelines", response_model=AdminClientProfileResponse)
async def update_brand_guidelines(
    client_id: UUID,
    body: UpdateBrandGuidelinesRequest,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminClientProfileResponse:
    return await admin_clients_service.update_brand_guidelines(session, client_id, body)


@router.get("/clients/{client_id}/batches", response_model=list[AdminBatchFolderResponse])
async def list_client_batches(
    client_id: UUID,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[AdminBatchFolderResponse]:
    return await admin_batches_service.list_batches_for_client(session, client_id)


@router.post("/clients/{client_id}/batches", response_model=AdminBatchFolderResponse)
async def create_batch(
    client_id: UUID,
    body: CreateBatchRequest,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminBatchFolderResponse:
    return await admin_batches_service.create_batch(session, client_id, body)


@router.patch("/batches/{batch_id}/assignments", response_model=AdminBatchFolderResponse)
async def set_batch_assignments(
    batch_id: UUID,
    body: SetBatchAssignmentsRequest,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminBatchFolderResponse:
    return await admin_batches_service.set_batch_assignments(session, batch_id, body)


@router.get(
    "/clients/{client_id}/batches/{batch_id}/videos",
    response_model=list[AdminVideoTicketResponse],
)
async def list_batch_videos(
    client_id: UUID,
    batch_id: UUID,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[AdminVideoTicketResponse]:
    return await admin_batches_service.list_videos_for_batch(session, client_id, batch_id)


@router.get("/staff", response_model=StaffListResponse)
async def list_staff(
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> StaffListResponse:
    return await admin_staff_service.list_staff(session)


@router.post("/staff", response_model=ProvisionStaffResponse)
async def provision_staff(
    body: ProvisionStaffRequest,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProvisionStaffResponse:
    return await admin_staff_service.provision_staff(session, body)


@router.get("/pipeline", response_model=AdminPipelineResponse)
async def get_pipeline(
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminPipelineResponse:
    return await admin_pipeline_service.get_pipeline(session)


@router.get("/deadlines", response_model=AdminDeadlinesResponse)
async def get_deadlines(
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminDeadlinesResponse:
    return await admin_deadlines_service.get_deadlines(session)


@router.patch(
    "/videos/{video_ticket_id}/deadline",
    response_model=SetVideoDeadlineResponse,
)
async def set_video_deadline(
    video_ticket_id: UUID,
    body: SetVideoDeadlineRequest,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SetVideoDeadlineResponse:
    return await admin_deadlines_service.set_video_deadline(
        session,
        video_ticket_id,
        body,
    )
