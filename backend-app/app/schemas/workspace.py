"""Role-scoped workspace read models (B2)."""

from uuid import UUID

from app.schemas.admin import (
    AdminBatchFolderResponse,
    AdminClientProfileResponse,
    AdminVideoTicketResponse,
)
from app.schemas.common import CamelModel


class ClientWorkspaceResponse(CamelModel):
    client: AdminClientProfileResponse
    batches: list[AdminBatchFolderResponse]
    videos: list[AdminVideoTicketResponse]


class EditorWorkspaceResponse(CamelModel):
    clients: list[AdminClientProfileResponse]
    batches: list[AdminBatchFolderResponse]
    videos: list[AdminVideoTicketResponse]


class SmmWorkspaceResponse(CamelModel):
    clients: list[AdminClientProfileResponse]
    batches: list[AdminBatchFolderResponse]
    videos: list[AdminVideoTicketResponse]


class AdminWorkspaceResponse(CamelModel):
    clients: list[AdminClientProfileResponse]
    batches: list[AdminBatchFolderResponse]
    videos: list[AdminVideoTicketResponse]


class BatchDetailResponse(CamelModel):
    batch: AdminBatchFolderResponse
    videos: list[AdminVideoTicketResponse]
