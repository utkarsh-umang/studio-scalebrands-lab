"""Batch activity / audit trail API schemas."""

from datetime import datetime
from uuid import UUID

from app.schemas.common import CamelModel


class BatchActivityItem(CamelModel):
    id: UUID
    batch_id: UUID
    video_ticket_id: UUID | None = None
    deliverable_index: int | None = None
    actor_role: str
    actor_name: str
    action: str
    summary: str
    detail: str | None = None
    at: datetime


class BatchActivityResponse(CamelModel):
    items: list[BatchActivityItem] = []
