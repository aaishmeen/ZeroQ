"""add_cloudinary_public_id_columns

Revision ID: d2e3f4a5b6c7
Revises: c1a516997b2c
Create Date: 2026-10-10 00:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'c1a516997b2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema safely by adding nullable public_id columns."""
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_public_id VARCHAR")
    op.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_public_id VARCHAR")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('events', 'banner_public_id')
    op.drop_column('users', 'avatar_public_id')
