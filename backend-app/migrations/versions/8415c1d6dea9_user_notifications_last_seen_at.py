"""user notifications_last_seen_at

Revision ID: 8415c1d6dea9
Revises: 20260523_0003
Create Date: 2026-07-02 19:34:35.760622

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8415c1d6dea9'
down_revision: Union[str, None] = '20260523_0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('notifications_last_seen_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'notifications_last_seen_at')
