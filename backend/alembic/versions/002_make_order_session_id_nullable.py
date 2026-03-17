"""make order session_id nullable and add customer_name

Revision ID: 002
Revises: 001
Create Date: 2026-03-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("orders", "session_id", existing_type=sa.Integer(), nullable=True)
    op.add_column("orders", sa.Column("customer_name", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "customer_name")
    op.alter_column("orders", "session_id", existing_type=sa.Integer(), nullable=False)
