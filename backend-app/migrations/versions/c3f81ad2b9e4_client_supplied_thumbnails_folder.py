"""client-supplied thumbnails folder

Clients who produce their own thumbnails send a separate flat numbered Drive
folder, which arrives independently of the editor's deliverables root.

Revision ID: c3f81ad2b9e4
Revises: b0a3e6b27d7f
Create Date: 2026-07-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3f81ad2b9e4'
down_revision: Union[str, None] = 'b0a3e6b27d7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'batches',
        sa.Column('client_thumbnails_folder_url', sa.String(length=2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('batches', 'client_thumbnails_folder_url')
