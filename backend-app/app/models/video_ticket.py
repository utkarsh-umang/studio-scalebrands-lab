"""Gate card or per-clip deliverable within a batch."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Column, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field

from app.db.base import Base
from app.models._columns import pg_enum, pg_enum_nullable
from app.models.enums import EditorWorkflowPhase, PipelineStage, VideoPipelineOwner


class VideoTicket(Base, table=True):
    __tablename__ = "video_tickets"
    __table_args__ = (
        UniqueConstraint(
            "batch_id",
            "deliverable_index",
            name="uq_video_tickets_batch_deliverable_index",
        ),
    )

    batch_id: uuid.UUID = Field(foreign_key="batches.id", index=True)
    client_id: uuid.UUID = Field(foreign_key="client_profiles.id", index=True)
    title: str = Field(max_length=512)
    deliverable_index: int | None = Field(default=None)
    pipeline_stage: PipelineStage = Field(
        sa_column=pg_enum(PipelineStage, "pipeline_stage"),
        default=PipelineStage.intake_pending,
    )
    pipeline_owner: VideoPipelineOwner = Field(
        sa_column=pg_enum(VideoPipelineOwner, "video_pipeline_owner"),
        default=VideoPipelineOwner.client,
    )
    stage_label: str = Field(default="", max_length=255)
    deadline_at: datetime | None = Field(default=None)
    deadline_role: str | None = Field(default=None, max_length=32)
    editor_workflow_phase: EditorWorkflowPhase | None = Field(
        default=None,
        sa_column=pg_enum_nullable(EditorWorkflowPhase, "editor_workflow_phase"),
    )
    editor_publish_title: str | None = Field(default=None, max_length=512)
    released_to_client_final_review: bool = Field(default=False)
    last_revision_requested_by: str | None = Field(default=None, max_length=32)
    asset_versions: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )
    deliverable_drive_slots: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )
    drive_slots_synced_at: datetime | None = Field(default=None)
    video_schedule: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )
    qa_flags: list[Any] | None = Field(default=None, sa_column=Column(JSONB, nullable=True))
    qa_general_note: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
