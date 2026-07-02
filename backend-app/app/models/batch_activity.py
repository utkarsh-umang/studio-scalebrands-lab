"""Append-only audit trail of pipeline decisions (approvals, rejections, QA, scheduling)."""

import uuid

from sqlalchemy import Column, Text
from sqlmodel import Field

from app.db.base import Base


class BatchActivity(Base, table=True):
    __tablename__ = "batch_activity"

    batch_id: uuid.UUID = Field(foreign_key="batches.id", index=True)
    video_ticket_id: uuid.UUID | None = Field(default=None, index=True)
    deliverable_index: int | None = Field(default=None)
    # Actor is denormalized (name/role) so the timeline needs no joins and
    # survives staff changes; user id kept for reference.
    actor_user_id: uuid.UUID | None = Field(default=None)
    actor_role: str = Field(max_length=32)
    actor_name: str = Field(max_length=255)
    action: str = Field(max_length=64)
    summary: str = Field(max_length=512)
    detail: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
