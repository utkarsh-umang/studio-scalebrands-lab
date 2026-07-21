"""Production package and SMM QA queue API schemas (B6)."""

from typing import Any
from uuid import UUID

from pydantic import Field

from app.schemas.admin import AdminVideoTicketResponse
from app.schemas.common import CamelModel


class UpdateProductionRequest(CamelModel):
    editor_publish_title: str | None = Field(default=None, alias="editorPublishTitle")


class SetClientTitleRequest(CamelModel):
    """Client-owned title for one deliverable (writes editorPublishTitle)."""

    title: str


class DriveMediaEntryInput(CamelModel):
    index: int
    drive_file_id: str = Field(alias="driveFileId")
    name: str
    mime_type: str | None = Field(default=None, alias="mimeType")
    modified_time: str | None = Field(default=None, alias="modifiedTime")


class DeliverableDriveSyncRequest(CamelModel):
    deliverable_index: int = Field(alias="deliverableIndex")
    video: DriveMediaEntryInput | None = None
    thumbnail: DriveMediaEntryInput | None = None
    synced_at: str | None = Field(default=None, alias="syncedAt")


class DeliverableReadinessDto(CamelModel):
    video_ready: bool = Field(alias="videoReady")
    thumbnail_ready: bool = Field(alias="thumbnailReady")
    title_ready: bool = Field(alias="titleReady")
    all_ready: bool = Field(alias="allReady")


class ProductionTicketResponse(CamelModel):
    ticket: AdminVideoTicketResponse
    readiness: DeliverableReadinessDto


class SubmitToSmmQaResponse(CamelModel):
    ticket: AdminVideoTicketResponse
    readiness: DeliverableReadinessDto
    missing: list[str] = Field(default_factory=list)


class ReadinessNotReadyDetail(CamelModel):
    error_code: str = "VALIDATION_ERROR"
    message: str = "Deliverable is not ready for SMM QA"
    readiness: DeliverableReadinessDto
    missing: list[str]
