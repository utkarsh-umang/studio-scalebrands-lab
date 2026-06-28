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


class BatchDriveManifestResponse(CamelModel):
    batch_id: str
    synced_at: str
    clips: list[DriveMediaEntryDto] = []
    videos: list[DriveMediaEntryDto] = []
    thumbnails: list[DriveMediaEntryDto] = []
    unmapped: list[DriveUnmappedEntryDto] = []
