"""Timestamped QA comments with rich media attachments.

Revision ID: e7f4a9c2d1b0
Revises: 5ad71f3a92c4
Create Date: 2026-08-23
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e7f4a9c2d1b0"
down_revision: str | None = "5ad71f3a92c4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE media_asset_kind ADD VALUE IF NOT EXISTS 'qa_attachment'")
    op.add_column(
        "qa_comments",
        sa.Column(
            "attachments",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("qa_comments", "attachments")
    # PostgreSQL enum values cannot be removed safely in-place. Leaving the
    # unused value keeps downgrade non-destructive.
