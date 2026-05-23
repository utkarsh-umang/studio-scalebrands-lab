"""Editor deliverables split API schemas (B5)."""

from app.schemas.admin import AdminBatchFolderResponse, AdminVideoTicketResponse
from app.schemas.clips import BatchVideosResponse
from app.schemas.common import CamelModel


class DeliverableTitleInput(CamelModel):
    index: int
    title: str


class SubmitDeliverablesDriveRequest(CamelModel):
    deliverables_drive_url: str
    deliverable_count: int | None = None
    deliverables: list[DeliverableTitleInput] | None = None


SubmitDeliverablesDriveResponse = BatchVideosResponse
