"""B0 wave 1 — core enums and tables.

Revision ID: 20260523_0001
Revises:
Create Date: 2026-05-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260523_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

user_role = postgresql.ENUM("client", "admin", "employee", name="user_role", create_type=False)
employee_kind = postgresql.ENUM("editor", "smm", name="employee_kind", create_type=False)
client_account_status = postgresql.ENUM(
    "active", "decommissioned", name="client_account_status", create_type=False
)
batch_status = postgresql.ENUM("active", "completed", name="batch_status", create_type=False)
batch_intake_path = postgresql.ENUM(
    "source_media", "clips_ready", name="batch_intake_path", create_type=False
)
batch_clip_review_phase = postgresql.ENUM(
    "smm_identifying",
    "awaiting_client",
    "with_smm",
    "approved",
    name="batch_clip_review_phase",
    create_type=False,
)
pipeline_stage = postgresql.ENUM(
    "intake_pending",
    "clips_identifying",
    "clip_client_review",
    "clips_ready_intake",
    "pre_split_production",
    "production",
    "smm_qa",
    "editor_fix",
    "client_qa",
    "revision_via_smm",
    "scheduling",
    "completed",
    name="pipeline_stage",
    create_type=False,
)
video_pipeline_owner = postgresql.ENUM(
    "client", "smm", "editor", "scheduling", "done", name="video_pipeline_owner", create_type=False
)
editor_workflow_phase = postgresql.ENUM(
    "videos", "thumbnails", "titles", "handed_off", name="editor_workflow_phase", create_type=False
)
brand_guidelines_source = postgresql.ENUM(
    "internal", "google_doc", name="brand_guidelines_source", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    employee_kind.create(bind, checkfirst=True)
    client_account_status.create(bind, checkfirst=True)
    batch_status.create(bind, checkfirst=True)
    batch_intake_path.create(bind, checkfirst=True)
    batch_clip_review_phase.create(bind, checkfirst=True)
    pipeline_stage.create(bind, checkfirst=True)
    video_pipeline_owner.create(bind, checkfirst=True)
    editor_workflow_phase.create(bind, checkfirst=True)
    brand_guidelines_source.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("employee_kind", employee_kind, nullable=True),
        sa.Column("client_profile_id", sa.Uuid(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_client_profile_id"), "users", ["client_profile_id"], unique=False)

    op.create_table(
        "client_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("credits_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("account_status", client_account_status, nullable=False),
        sa.Column("decommission_reason", sa.Text(), nullable=True),
        sa.Column("decommissioned_at", sa.DateTime(), nullable=True),
        sa.Column("assigned_smm_id", sa.Uuid(), nullable=True),
        sa.Column("assigned_editor_id", sa.Uuid(), nullable=True),
        sa.Column("brand_guidelines_source", brand_guidelines_source, nullable=False),
        sa.Column("brand_guidelines_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("brand_guidelines_google_doc_url", sa.String(length=2048), nullable=True),
        sa.Column("brand_guidelines_updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["assigned_editor_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["assigned_smm_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_foreign_key(
        "fk_users_client_profile_id",
        "users",
        "client_profiles",
        ["client_profile_id"],
        ["id"],
    )

    op.create_table(
        "batches",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("batch_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("status", batch_status, nullable=False),
        sa.Column("pipeline_stage", pipeline_stage, nullable=False),
        sa.Column("video_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("intake_path", batch_intake_path, nullable=True),
        sa.Column("clip_review_phase", batch_clip_review_phase, nullable=True),
        sa.Column("source_media_url", sa.String(length=2048), nullable=True),
        sa.Column("clips_folder_url", sa.String(length=2048), nullable=True),
        sa.Column("editor_deliverables_drive_url", sa.String(length=2048), nullable=True),
        sa.Column("credit_cost", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("credits_debited", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("batch_schedule", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["client_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("client_id", "batch_number", name="uq_batches_client_batch_number"),
    )
    op.create_index(op.f("ix_batches_client_id"), "batches", ["client_id"], unique=False)

    op.create_table(
        "video_tickets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("batch_id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("deliverable_index", sa.Integer(), nullable=True),
        sa.Column("pipeline_stage", pipeline_stage, nullable=False),
        sa.Column("pipeline_owner", video_pipeline_owner, nullable=False),
        sa.Column("stage_label", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("deadline_at", sa.DateTime(), nullable=True),
        sa.Column("deadline_role", sa.String(length=32), nullable=True),
        sa.Column("editor_workflow_phase", editor_workflow_phase, nullable=True),
        sa.Column("editor_publish_title", sa.String(length=512), nullable=True),
        sa.Column(
            "released_to_client_final_review",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("last_revision_requested_by", sa.String(length=32), nullable=True),
        sa.Column("asset_versions", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("deliverable_drive_slots", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("drive_slots_synced_at", sa.DateTime(), nullable=True),
        sa.Column("video_schedule", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("qa_flags", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("qa_general_note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.id"]),
        sa.ForeignKeyConstraint(["client_id"], ["client_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "batch_id",
            "deliverable_index",
            name="uq_video_tickets_batch_deliverable_index",
        ),
    )
    op.create_index(op.f("ix_video_tickets_batch_id"), "video_tickets", ["batch_id"], unique=False)
    op.create_index(op.f("ix_video_tickets_client_id"), "video_tickets", ["client_id"], unique=False)


def downgrade() -> None:
    op.drop_table("video_tickets")
    op.drop_table("batches")
    op.drop_constraint("fk_users_client_profile_id", "users", type_="foreignkey")
    op.drop_table("client_profiles")
    op.drop_index(op.f("ix_users_client_profile_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    brand_guidelines_source.drop(bind, checkfirst=True)
    editor_workflow_phase.drop(bind, checkfirst=True)
    video_pipeline_owner.drop(bind, checkfirst=True)
    pipeline_stage.drop(bind, checkfirst=True)
    batch_clip_review_phase.drop(bind, checkfirst=True)
    batch_intake_path.drop(bind, checkfirst=True)
    batch_status.drop(bind, checkfirst=True)
    client_account_status.drop(bind, checkfirst=True)
    employee_kind.drop(bind, checkfirst=True)
    user_role.drop(bind, checkfirst=True)
