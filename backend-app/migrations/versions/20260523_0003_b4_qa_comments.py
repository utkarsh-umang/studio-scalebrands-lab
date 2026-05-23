"""B4 — qa_comments table and enums.

Revision ID: 20260523_0003
Revises: 20260523_0002
Create Date: 2026-05-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260523_0003"
down_revision: Union[str, None] = "20260523_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

qa_media_slot = postgresql.ENUM("clip", "video", "thumbnail", name="qa_media_slot", create_type=False)
qa_comment_kind = postgresql.ENUM(
    "timestamp",
    "general",
    "clip_note",
    name="qa_comment_kind",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    qa_media_slot.create(bind, checkfirst=True)
    qa_comment_kind.create(bind, checkfirst=True)

    op.create_table(
        "qa_comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("video_ticket_id", sa.Uuid(), nullable=False),
        sa.Column("slot", qa_media_slot, nullable=False),
        sa.Column("asset_version", sa.Integer(), nullable=False),
        sa.Column("kind", qa_comment_kind, nullable=False),
        sa.Column("author_role", sa.String(length=32), nullable=False),
        sa.Column("author_user_id", sa.Uuid(), nullable=True),
        sa.Column("at_seconds", sa.Integer(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("deprecated", sa.Boolean(), nullable=False, server_default="false"),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["video_ticket_id"], ["video_tickets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_qa_comments_video_ticket_id"),
        "qa_comments",
        ["video_ticket_id"],
        unique=False,
    )
    op.create_index(
        "ix_qa_comments_video_ticket_slot_deprecated",
        "qa_comments",
        ["video_ticket_id", "slot", "deprecated"],
        unique=False,
    )
    op.create_index(
        "ix_qa_comments_video_ticket_created_at",
        "qa_comments",
        ["video_ticket_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_qa_comments_video_ticket_created_at", table_name="qa_comments")
    op.drop_index("ix_qa_comments_video_ticket_slot_deprecated", table_name="qa_comments")
    op.drop_index(op.f("ix_qa_comments_video_ticket_id"), table_name="qa_comments")
    op.drop_table("qa_comments")
    qa_comment_kind.drop(op.get_bind(), checkfirst=True)
    qa_media_slot.drop(op.get_bind(), checkfirst=True)
