"""Clip review API schemas (B4)."""

from uuid import UUID

from app.schemas.admin import AdminBatchFolderResponse, AdminVideoTicketResponse
from app.schemas.common import CamelModel


class SubmitClipsFolderRequest(CamelModel):
    clips_folder_url: str


class ApproveBatchClipsRequest(CamelModel):
    video_ticket_id: UUID
    clip_count: int | None = None


class RejectBatchClipsRequest(CamelModel):
    video_ticket_id: UUID
    note: str


class BatchVideosResponse(CamelModel):
    batch: AdminBatchFolderResponse
    videos: list[AdminVideoTicketResponse]
