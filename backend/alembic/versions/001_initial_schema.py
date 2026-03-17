"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums using raw SQL for IF NOT EXISTS support
    op.execute("DO $$ BEGIN CREATE TYPE tablestatus AS ENUM ('available', 'occupied', 'reserved'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE menucategory AS ENUM ('food', 'drink'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE sessionstatus AS ENUM ('active', 'completed', 'reserved', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$")

    table_status = postgresql.ENUM("available", "occupied", "reserved", name="tablestatus", create_type=False)
    menu_category = postgresql.ENUM("food", "drink", name="menucategory", create_type=False)
    session_status = postgresql.ENUM("active", "completed", "reserved", "cancelled", name="sessionstatus", create_type=False)

    # Tables
    op.create_table(
        "tables",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("number", sa.Integer(), nullable=False, unique=True),
        sa.Column("status", table_status, nullable=False, server_default="available"),
        sa.Column("hourly_rate", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Clients
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Menu Items
    op.create_table(
        "menu_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", menu_category, nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Sessions
    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("table_id", sa.Integer(), sa.ForeignKey("tables.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reserved_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reserved_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", session_status, nullable=False, server_default="active"),
        sa.Column("table_cost", sa.Numeric(10, 2), server_default="0"),
        sa.Column("total_cost", sa.Numeric(10, 2), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Orders
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Order Items
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("menu_item_id", sa.Integer(), sa.ForeignKey("menu_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),
    )

    # Indexes
    op.create_index("idx_sessions_table_id", "sessions", ["table_id"])
    op.create_index("idx_sessions_client_id", "sessions", ["client_id"])
    op.create_index("idx_sessions_status", "sessions", ["status"])
    op.create_index("idx_orders_session_id", "orders", ["session_id"])
    op.create_index("idx_order_items_order_id", "order_items", ["order_id"])
    op.create_index("idx_clients_phone", "clients", ["phone"])


def downgrade() -> None:
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("sessions")
    op.drop_table("menu_items")
    op.drop_table("clients")
    op.drop_table("tables")

    sa.Enum(name="sessionstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="menucategory").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="tablestatus").drop(op.get_bind(), checkfirst=True)
