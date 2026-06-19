"""add users table

Revision ID: add_users_v2
Revises: dd9600a52a20
Create Date: 2026-06-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'dd9600a52a20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False, comment='用户名'),
        sa.Column('hashed_password', sa.String(length=255), nullable=False, comment='密码哈希'),
        sa.Column('display_name', sa.String(length=100), nullable=True, comment='显示名称'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('true'), comment='是否启用'),
        sa.Column('is_admin', sa.Boolean(), nullable=True, server_default=sa.text('false'), comment='是否管理员'),
        sa.Column('user_type', sa.String(length=20), nullable=True, server_default=sa.text("'external'"), comment='用户类型: internal/external'),
        sa.Column('trial_days', sa.Integer(), nullable=True, server_default=sa.text('3'), comment='试用天数'),
        sa.Column('trial_expires_at', sa.DateTime(timezone=True), nullable=True, comment='试用到期时间'),
        sa.Column('is_paid', sa.Boolean(), nullable=True, server_default=sa.text('false'), comment='是否已付费'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
