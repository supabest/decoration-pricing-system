"""add benchmark_prices table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('benchmark_prices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trade_team', sa.String(length=50), nullable=False, comment='班组名称（如泥水班组）'),
        sa.Column('internal_code', sa.String(length=50), nullable=True, comment='内部编号（如 NS-01）'),
        sa.Column('work_type', sa.String(length=50), nullable=True, comment='工种'),
        sa.Column('item_name', sa.String(length=300), nullable=False, comment='项目名称'),
        sa.Column('spec', sa.Text(), nullable=True, comment='项目特征及主要内容'),
        sa.Column('unit', sa.String(length=20), nullable=False, comment='单位'),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=False, comment='人工综合单价（2025）'),
        sa.Column('remark', sa.Text(), nullable=True, comment='备注'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_benchmark_prices_id'), 'benchmark_prices', ['id'], unique=False)
    op.create_index(op.f('ix_benchmark_prices_trade_team'), 'benchmark_prices', ['trade_team'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_benchmark_prices_trade_team'), table_name='benchmark_prices')
    op.drop_index(op.f('ix_benchmark_prices_id'), table_name='benchmark_prices')
    op.drop_table('benchmark_prices')
