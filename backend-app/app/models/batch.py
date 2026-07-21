"""One content cycle per client."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Column, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field

from app.db.base import Base
from app.models._columns import pg_enum, pg_enum_nullable
from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    BatchStatus,
    PipelineStage,
)


class Batch(Base, table=True):
    __tablename__ = "batches"
    __table_args__ = (UniqueConstraint("client_id", "batch_number", name="uq_batches_client_batch_number"),)

    client_id: uuid.UUID = Field(foreign_key="client_profiles.id", index=True)
    batch_number: int
    title: str = Field(max_length=512)
    status: BatchStatus = Field(
        sa_column=pg_enum(BatchStatus, "batch_status"),
        default=BatchStatus.active,
    )
    pipeline_stage: PipelineStage = Field(
        sa_column=pg_enum(PipelineStage, "pipeline_stage"),
        default=PipelineStage.intake_pending,
    )
    video_count: int = Field(default=0)
    intake_path: BatchIntakePath | None = Field(
        default=None,
        sa_column=pg_enum_nullable(BatchIntakePath, "batch_intake_path"),
    )
    clip_review_phase: BatchClipReviewPhase | None = Field(
        default=None,
        sa_column=pg_enum_nullable(BatchClipReviewPhase, "batch_clip_review_phase"),
    )
    source_media_url: str | None = Field(default=None, max_length=2048)
    clips_folder_url: str | None = Field(default=None, max_length=2048)
    editor_deliverables_drive_url: str | None = Field(default=None, max_length=2048)
    # Clients who make their own thumbnails send a flat numbered folder of their
    # own, separately from (and usually later than) the editor's deliverables
    # root. When set, it supersedes the deliverables thumbnails/ subfolder.
    client_thumbnails_folder_url: str | None = Field(default=None, max_length=2048)
    credit_cost: int = Field(default=0)
    credits_debited: bool = Field(default=False)
    # Which shared team member (smm | editor) owns each shared step. The CSM used
    # to decide this offline; null = unassigned.
    clip_owner_kind: str | None = Field(default=None, max_length=16)
    thumbnail_owner_kind: str | None = Field(default=None, max_length=16)
    title_owner_kind: str | None = Field(default=None, max_length=16)
    # Path A (idea-first): the SMM-researched idea list the client approves.
    idea_list: list[Any] | None = Field(default=None, sa_column=Column(JSONB, nullable=True))
    batch_schedule: dict[str, Any] | None = Field(default=None, sa_column=Column(JSONB, nullable=True))
    completed_at: datetime | None = Field(default=None)
