"""add_unique_constraints_for_registrations_and_events

Revision ID: c1a516997b2c
Revises: a1b2c3d4e5f6
Create Date: 2026-10-04 01:42:27.446673

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a516997b2c'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE events DROP CONSTRAINT IF EXISTS uq_event_title_venue_date;")
    op.execute("DROP INDEX IF EXISTS uq_event_title_venue_date;")
    op.create_unique_constraint('uq_event_title_venue_date', 'events', ['title', 'venue', 'date'])

    op.execute("ALTER TABLE registrations DROP CONSTRAINT IF EXISTS uq_user_event_registration;")
    op.execute("DROP INDEX IF EXISTS uq_user_event_registration;")
    op.create_unique_constraint('uq_user_event_registration', 'registrations', ['user_id', 'event_id'])


def downgrade() -> None:
    op.drop_constraint('uq_user_event_registration', 'registrations', type_='unique')
    op.drop_constraint('uq_event_title_venue_date', 'events', type_='unique')
