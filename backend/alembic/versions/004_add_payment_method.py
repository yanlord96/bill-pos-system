"""add payment_method to sessions and orders

Revision ID: 004
Revises: 003
Create Date: 2026-03-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sessions", sa.Column("payment_method", sa.String(20), nullable=True))
    op.add_column("orders", sa.Column("payment_method", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "payment_method")
    op.drop_column("sessions", "payment_method")
