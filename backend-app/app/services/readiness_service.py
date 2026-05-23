"""Deliverable readiness checks (B6)."""

from dataclasses import dataclass

from app.models.batch import Batch
from app.models.video_ticket import VideoTicket


@dataclass(frozen=True)
class DeliverableReadiness:
    video_ready: bool
    thumbnail_ready: bool
    title_ready: bool

    @property
    def all_ready(self) -> bool:
        return self.video_ready and self.thumbnail_ready and self.title_ready

    def missing_fields(self) -> list[str]:
        missing: list[str] = []
        if not self.video_ready:
            missing.append("video")
        if not self.thumbnail_ready:
            missing.append("thumbnail")
        if not self.title_ready:
            missing.append("title")
        return missing


def _slot_has_file(slots: dict | None, key: str) -> bool:
    if not slots or not isinstance(slots, dict):
        return False
    entry = slots.get(key)
    if not isinstance(entry, dict):
        return False
    file_id = entry.get("driveFileId") or entry.get("drive_file_id")
    return bool(file_id and str(file_id).strip())


def compute_readiness(ticket: VideoTicket, batch: Batch) -> DeliverableReadiness:
    _ = batch
    slots = ticket.deliverable_drive_slots
    title_ready = bool((ticket.editor_publish_title or "").strip())
    return DeliverableReadiness(
        video_ready=_slot_has_file(slots, "video"),
        thumbnail_ready=_slot_has_file(slots, "thumbnail"),
        title_ready=title_ready,
    )
