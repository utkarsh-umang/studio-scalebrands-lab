"""Immutable media objects stored in Studio-owned object storage."""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Column, Index, Text, UniqueConstraint
from sqlmodel import Field

from app.db.base import Base
from app.models._columns import pg_enum
from app.models.enums import MediaAssetKind, MediaAssetStatus


class MediaAsset(Base, table=True):
    __tablename__ = "media_assets"
    __table_args__ = (
        UniqueConstraint("object_key", name="uq_media_assets_object_key"),
        UniqueConstraint(
            "video_ticket_id",
            "kind",
            "version",
            name="uq_media_assets_ticket_kind_version",
        ),
        Index(
            "ix_media_assets_current_ticket_kind",
            "video_ticket_id",
            "kind",
            "is_current",
        ),
    )

    batch_id: uuid.UUID = Field(foreign_key="batches.id", index=True)
    video_ticket_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="video_tickets.id",
        index=True,
    )
    uploaded_by_user_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="users.id",
        index=True,
    )
    kind: MediaAssetKind = Field(sa_column=pg_enum(MediaAssetKind, "media_asset_kind"))
    status: MediaAssetStatus = Field(
        sa_column=pg_enum(MediaAssetStatus, "media_asset_status"),
        default=MediaAssetStatus.pending,
    )
    version: int = Field(default=1)
    is_current: bool = Field(default=False, index=True)
    object_key: str = Field(max_length=1024)
    original_filename: str = Field(max_length=512)
    content_type: str = Field(max_length=255)
    expected_size_bytes: int = Field(sa_column=Column(BigInteger, nullable=False))
    size_bytes: int | None = Field(default=None, sa_column=Column(BigInteger, nullable=True))
    etag: str | None = Field(default=None, max_length=255)
    storage_version_id: str | None = Field(default=None, max_length=1024)
    source_provider: str = Field(default="direct_upload", max_length=32)
    source_external_id: str | None = Field(default=None, max_length=1024)
    ready_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
