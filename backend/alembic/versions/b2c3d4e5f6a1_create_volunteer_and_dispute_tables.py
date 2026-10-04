"""create volunteer and dispute tables

Revision ID: b2c3d4e5f6a1
Revises: ff003a68475e
Create Date: 2026-09-01 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, Sequence[str], None] = 'ff003a68475e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Make reg_no nullable on users table
    op.alter_column('users', 'reg_no', existing_type=sa.String(), nullable=True)

    # 2. Create volunteer_openings
    op.create_table(
        'volunteer_openings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('events.id'), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('volunteers_needed', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('deadline', sa.String(), nullable=True),
        sa.Column('gate_area', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_volunteer_openings_id'), 'volunteer_openings', ['id'], unique=False)

    # 3. Create volunteer_applications
    op.create_table(
        'volunteer_applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('events.id'), nullable=False),
        sa.Column('opening_id', sa.Integer(), sa.ForeignKey('volunteer_openings.id'), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('experience', sa.String(), nullable=True),
        sa.Column('applied_at', sa.DateTime(), nullable=False),
        sa.Column('reviewed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_volunteer_applications_id'), 'volunteer_applications', ['id'], unique=False)

    # 4. Create volunteer_assignments
    op.create_table(
        'volunteer_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('volunteer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('events.id'), nullable=False),
        sa.Column('position', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('assigned_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_volunteer_assignments_id'), 'volunteer_assignments', ['id'], unique=False)

    # 5. Create volunteer_notifications
    op.create_table(
        'volunteer_notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('events.id'), nullable=False),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_volunteer_notifications_id'), 'volunteer_notifications', ['id'], unique=False)

    # 6. Create disputes
    op.create_table(
        'disputes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('events.id'), nullable=False),
        sa.Column('volunteer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('position', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('registration_id', sa.Integer(), sa.ForeignKey('registrations.id'), nullable=True),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='OPEN'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_disputes_id'), 'disputes', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_disputes_id'), table_name='disputes')
    op.drop_table('disputes')
    op.drop_index(op.f('ix_volunteer_notifications_id'), table_name='volunteer_notifications')
    op.drop_table('volunteer_notifications')
    op.drop_index(op.f('ix_volunteer_assignments_id'), table_name='volunteer_assignments')
    op.drop_table('volunteer_assignments')
    op.drop_index(op.f('ix_volunteer_applications_id'), table_name='volunteer_applications')
    op.drop_table('volunteer_applications')
    op.drop_index(op.f('ix_volunteer_openings_id'), table_name='volunteer_openings')
    op.drop_table('volunteer_openings')
    op.alter_column('users', 'reg_no', existing_type=sa.String(), nullable=False)
