"""SQLModel base class and common mixins."""

import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    """Naive UTC for TIMESTAMP WITHOUT TIME ZONE columns (asyncpg)."""
    return datetime.now(UTC).replace(tzinfo=None)


class Base(SQLModel):
    """Base model with common columns: id, created_at, updated_at."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
