"""path a idea-first

Revision ID: b0a3e6b27d7f
Revises: 4e954a29566c
Create Date: 2026-07-02 23:29:28.081489

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b0a3e6b27d7f'
down_revision: Union[str, None] = '4e954a29566c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_NEW_STAGES = ("idea_research", "idea_review", "idea_footage_pending")


def upgrade() -> None:
    # Enum ADD VALUE cannot run inside a transaction on some PG setups; commit first.
    op.execute("COMMIT")
    for value in _NEW_STAGES:
        op.execute(f"ALTER TYPE pipeline_stage ADD VALUE IF NOT EXISTS '{value}'")
    op.execute("ALTER TYPE batch_intake_path ADD VALUE IF NOT EXISTS 'idea_first'")
    op.add_column(
        "batches",
        sa.Column("idea_list", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    # Postgres cannot drop enum values; leave them. Just drop the column.
    op.drop_column("batches", "idea_list")
