"""add_accepting_volunteers_to_events

Revision ID: f4e5d6c7b8a9
Revises: e3f4a5b6c7d8
Create Date: 2026-10-10 01:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4e5d6c7b8a9'
down_revision: Union[str, Sequence[str], None] = 'e3f4a5b6c7d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS accepting_volunteers BOOLEAN DEFAULT true NOT NULL;")


def downgrade() -> None:
    op.drop_column('events', 'accepting_volunteers')
