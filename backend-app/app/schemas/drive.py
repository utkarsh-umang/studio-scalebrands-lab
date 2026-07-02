"""Live Drive manifest API schemas."""

from app.schemas.common import CamelModel


class DriveMediaEntryDto(CamelModel):
    index: int
    drive_file_id: str
    name: str
    mime_type: str
    modified_time: str


class DriveUnmappedEntryDto(CamelModel):
    name: str
    reason: str


class DriveClipsDiagnosticsDto(CamelModel):
    linked: bool
    accessible: bool
    total: int
    numbered: int
    status: str


class DriveDeliverablesDiagnosticsDto(CamelModel):
    linked: bool
    accessible: bool
    has_videos_subfolder: bool
    has_thumbnails_subfolder: bool
    videos: int
    thumbnails: int
    status: str


class DriveDiagnosticsDto(CamelModel):
    service_account_email: str | None = None
    clips: DriveClipsDiagnosticsDto
    deliverables: DriveDeliverablesDiagnosticsDto


class BatchDriveManifestResponse(CamelModel):
    batch_id: str
    synced_at: str
    clips: list[DriveMediaEntryDto] = []
    videos: list[DriveMediaEntryDto] = []
    thumbnails: list[DriveMediaEntryDto] = []
    unmapped: list[DriveUnmappedEntryDto] = []
    diagnostics: DriveDiagnosticsDto | None = None
