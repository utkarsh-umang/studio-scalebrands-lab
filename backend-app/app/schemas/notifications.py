"""Notifications inbox API schemas."""

from datetime import datetime
from uuid import UUID

from app.schemas.common import CamelModel


class NotificationItemDto(CamelModel):
    id: UUID
    batch_id: UUID
    batch_title: str
    deliverable_index: int | None = None
    stage: str
    stage_label: str
    message: str
    since: datetime
    unread: bool


class NotificationInboxResponse(CamelModel):
    items: list[NotificationItemDto] = []
    unread_count: int = 0
    last_seen_at: datetime | None = None


class MarkSeenResponse(CamelModel):
    last_seen_at: datetime
