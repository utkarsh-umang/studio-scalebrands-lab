"""Per-video scheduling and batch credit debit (B9)."""

from uuid import UUID

from pydantic import Field

from app.schemas.admin import AdminBatchFolderResponse, AdminVideoTicketResponse
from app.schemas.common import CamelModel

ALLOWED_SCHEDULE_PLATFORMS = frozenset(
    {
        "YouTube Shorts",
        "Instagram Reels",
        "TikTok",
        "Facebook",
        "LinkedIn",
    },
)


class ScheduleVideoRequest(CamelModel):
    platform: str = Field(min_length=1, max_length=128)
    go_live_date: str = Field(alias="goLiveDate", min_length=1, max_length=32)
    go_live_time: str = Field(alias="goLiveTime", min_length=1, max_length=16)


class ScheduleVideoClientResponse(CamelModel):
    id: UUID
    credits: int


class ScheduleVideoResponse(CamelModel):
    ticket: AdminVideoTicketResponse
    batch: AdminBatchFolderResponse
    client: ScheduleVideoClientResponse | None = None
