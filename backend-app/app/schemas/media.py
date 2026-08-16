"""Object-storage upload and playback contracts."""

from datetime import datetime
from uuid import UUID

from app.models.enums import MediaAssetKind, MediaAssetStatus
from app.schemas.common import CamelModel


class InitiateMediaUploadRequest(CamelModel):
    kind: MediaAssetKind
    filename: str
    content_type: str
    size_bytes: int


class CompleteMediaUploadRequest(CamelModel):
    etag: str | None = None


class MediaAssetResponse(CamelModel):
    id: UUID
    batch_id: UUID
    video_ticket_id: UUID | None
    kind: MediaAssetKind
    status: MediaAssetStatus
    version: int
    is_current: bool
    original_filename: str
    content_type: str
    size_bytes: int | None
    created_at: datetime
    ready_at: datetime | None


class InitiateMediaUploadResponse(CamelModel):
    asset: MediaAssetResponse
    upload_url: str
    upload_method: str = "PUT"
    upload_headers: dict[str, str]
    expires_at: datetime


class CompleteMediaUploadResponse(CamelModel):
    asset: MediaAssetResponse


class MediaAssetListResponse(CamelModel):
    assets: list[MediaAssetResponse]


class MediaPlaybackResponse(CamelModel):
    asset_id: UUID
    url: str
    expires_at: datetime
