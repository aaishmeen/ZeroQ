"""add_notification_recipient_and_role

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-10-10 01:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, Sequence[str], None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema safely by adding recipient_id and target_role columns to volunteer_notifications."""
    op.execute("ALTER TABLE volunteer_notifications ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES users(id)")
    op.execute("ALTER TABLE volunteer_notifications ADD COLUMN IF NOT EXISTS target_role VARCHAR")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('volunteer_notifications', 'target_role')
    op.drop_column('volunteer_notifications', 'recipient_id')
