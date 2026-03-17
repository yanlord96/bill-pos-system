"""add users table with default owner

Revision ID: 003
Revises: 002
Create Date: 2026-03-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    users_table = op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(50), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.bulk_insert(users_table, [
        {
            "username": "admin",
            "hashed_password": pwd_context.hash("admin123"),
            "role": "owner",
        },
        {
            "username": "worker",
            "hashed_password": pwd_context.hash("worker123"),
            "role": "worker",
        },
    ])


def downgrade() -> None:
    op.drop_table("users")
