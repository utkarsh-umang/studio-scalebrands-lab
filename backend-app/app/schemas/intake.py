"""Client batch intake API schemas (B3)."""

from app.models.enums import BatchIntakePath
from app.schemas.admin import AdminBatchFolderResponse, AdminVideoTicketResponse
from app.schemas.common import CamelModel


class SubmitBatchIntakeRequest(CamelModel):
    intake_path: BatchIntakePath
    url: str


class SubmitClientThumbnailsRequest(CamelModel):
    url: str


class SubmitBatchIntakeResponse(CamelModel):
    batch: AdminBatchFolderResponse
    videos: list[AdminVideoTicketResponse]
