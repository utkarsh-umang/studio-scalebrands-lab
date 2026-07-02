"""batch shared-step owner kinds

Revision ID: 4e954a29566c
Revises: 0a8fb4670b88
Create Date: 2026-07-02 22:28:52.376306

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4e954a29566c'
down_revision: Union[str, None] = '0a8fb4670b88'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('batches', sa.Column('clip_owner_kind', sa.String(length=16), nullable=True))
    op.add_column('batches', sa.Column('thumbnail_owner_kind', sa.String(length=16), nullable=True))
    op.add_column('batches', sa.Column('title_owner_kind', sa.String(length=16), nullable=True))


def downgrade() -> None:
    op.drop_column('batches', 'title_owner_kind')
    op.drop_column('batches', 'thumbnail_owner_kind')
    op.drop_column('batches', 'clip_owner_kind')
