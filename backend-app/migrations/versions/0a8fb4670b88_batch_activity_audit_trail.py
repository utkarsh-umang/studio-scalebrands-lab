"""batch_activity audit trail

Revision ID: 0a8fb4670b88
Revises: 8415c1d6dea9
Create Date: 2026-07-02 22:14:08.441146

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a8fb4670b88'
down_revision: Union[str, None] = '8415c1d6dea9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('batch_activity',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('batch_id', sa.Uuid(), nullable=False),
    sa.Column('video_ticket_id', sa.Uuid(), nullable=True),
    sa.Column('deliverable_index', sa.Integer(), nullable=True),
    sa.Column('actor_user_id', sa.Uuid(), nullable=True),
    sa.Column('actor_role', sa.String(length=32), nullable=False),
    sa.Column('actor_name', sa.String(length=255), nullable=False),
    sa.Column('action', sa.String(length=64), nullable=False),
    sa.Column('summary', sa.String(length=512), nullable=False),
    sa.Column('detail', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_batch_activity_batch_id'), 'batch_activity', ['batch_id'], unique=False)
    op.create_index(op.f('ix_batch_activity_video_ticket_id'), 'batch_activity', ['video_ticket_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_batch_activity_video_ticket_id'), table_name='batch_activity')
    op.drop_index(op.f('ix_batch_activity_batch_id'), table_name='batch_activity')
    op.drop_table('batch_activity')
