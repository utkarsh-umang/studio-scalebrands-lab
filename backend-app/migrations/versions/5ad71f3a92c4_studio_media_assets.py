"""Studio-owned media assets.

Revision ID: 5ad71f3a92c4
Revises: c3f81ad2b9e4
Create Date: 2026-08-09
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "5ad71f3a92c4"
down_revision: str | None = "c3f81ad2b9e4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    media_asset_kind = postgresql.ENUM(
        "source_clip", "video", "thumbnail", name="media_asset_kind", create_type=False
    )
    media_asset_status = postgresql.ENUM(
        "pending", "ready", "failed", name="media_asset_status", create_type=False
    )
    media_asset_kind.create(op.get_bind(), checkfirst=True)
    media_asset_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "media_assets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("batch_id", sa.Uuid(), nullable=False),
        sa.Column("video_ticket_id", sa.Uuid(), nullable=True),
        sa.Column("uploaded_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("kind", media_asset_kind, nullable=False),
        sa.Column("status", media_asset_status, nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.Column("object_key", sa.String(length=1024), nullable=False),
        sa.Column("original_filename", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=255), nullable=False),
        sa.Column("expected_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("etag", sa.String(length=255), nullable=True),
        sa.Column("storage_version_id", sa.String(length=1024), nullable=True),
        sa.Column("source_provider", sa.String(length=32), nullable=False),
        sa.Column("source_external_id", sa.String(length=1024), nullable=True),
        sa.Column("ready_at", sa.DateTime(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.id"]),
        sa.ForeignKeyConstraint(["uploaded_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["video_ticket_id"], ["video_tickets.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("object_key", name="uq_media_assets_object_key"),
        sa.UniqueConstraint(
            "video_ticket_id",
            "kind",
            "version",
            name="uq_media_assets_ticket_kind_version",
        ),
    )
    op.create_index("ix_media_assets_batch_id", "media_assets", ["batch_id"])
    op.create_index("ix_media_assets_video_ticket_id", "media_assets", ["video_ticket_id"])
    op.create_index("ix_media_assets_uploaded_by_user_id", "media_assets", ["uploaded_by_user_id"])
    op.create_index("ix_media_assets_is_current", "media_assets", ["is_current"])
    op.create_index(
        "ix_media_assets_current_ticket_kind",
        "media_assets",
        ["video_ticket_id", "kind", "is_current"],
    )


def downgrade() -> None:
    op.drop_index("ix_media_assets_current_ticket_kind", table_name="media_assets")
    op.drop_index("ix_media_assets_is_current", table_name="media_assets")
    op.drop_index("ix_media_assets_uploaded_by_user_id", table_name="media_assets")
    op.drop_index("ix_media_assets_video_ticket_id", table_name="media_assets")
    op.drop_index("ix_media_assets_batch_id", table_name="media_assets")
    op.drop_table("media_assets")
    postgresql.ENUM(name="media_asset_status").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="media_asset_kind").drop(op.get_bind(), checkfirst=True)
