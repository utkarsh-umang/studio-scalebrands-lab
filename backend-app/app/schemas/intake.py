"""Client batch intake API schemas (B3)."""

from uuid import UUID

from app.models.enums import BatchIntakePath
from app.schemas.admin import AdminBatchFolderResponse, AdminVideoTicketResponse
from app.schemas.common import CamelModel
from app.schemas.media import InitiateMediaUploadResponse


class SubmitBatchIntakeRequest(CamelModel):
    intake_path: BatchIntakePath
    url: str


class SubmitClientThumbnailsRequest(CamelModel):
    url: str


class SourceClipFileInput(CamelModel):
    filename: str
    content_type: str
    size_bytes: int


class PrepareSourceClipsRequest(CamelModel):
    files: list[SourceClipFileInput]
    append: bool = False


class PreparedSourceClipUpload(CamelModel):
    video_ticket_id: UUID
    deliverable_index: int
    filename: str
    upload: InitiateMediaUploadResponse


class PrepareSourceClipsResponse(CamelModel):
    uploads: list[PreparedSourceClipUpload]


class SubmitBatchIntakeResponse(CamelModel):
    batch: AdminBatchFolderResponse
    videos: list[AdminVideoTicketResponse]
