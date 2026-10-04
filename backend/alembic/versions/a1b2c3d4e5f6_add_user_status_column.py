"""add user status column and extra fields safely

Revision ID: a1b2c3d4e5f6
Revises: ff003a68475e
Create Date: 2026-09-05 21:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'approved'")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS volunteer_id VARCHAR")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_volunteer_id') THEN ALTER TABLE users ADD CONSTRAINT uq_users_volunteer_id UNIQUE (volunteer_id); END IF; END $$;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR")
    op.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS volunteers_limit INTEGER DEFAULT 10")
    op.execute("ALTER TABLE volunteer_applications ADD COLUMN IF NOT EXISTS experience VARCHAR")
    op.execute("ALTER TABLE volunteer_applications ADD COLUMN IF NOT EXISTS opening_id INTEGER REFERENCES volunteer_openings(id)")


def downgrade() -> None:
    op.drop_column('volunteer_applications', 'opening_id')
    op.drop_column('volunteer_applications', 'experience')
    op.drop_column('events', 'volunteers_limit')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'avatar_url')
    op.drop_constraint('uq_users_volunteer_id', 'users', type_='unique')
    op.drop_column('users', 'volunteer_id')
    op.drop_column('users', 'status')
