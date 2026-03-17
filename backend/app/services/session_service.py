import math
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.table import Table, TableStatus
from app.models.client import Client
from app.models.session import Session, SessionStatus
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.session import SessionCreate


async def get_all_sessions(
    db: AsyncSession,
    status: SessionStatus | None = None,
    filter_date: date | None = None,
) -> list[Session]:
    stmt = (
        select(Session)
        .options(selectinload(Session.table), selectinload(Session.client))
        .order_by(Session.created_at.desc())
    )
    if status:
        stmt = stmt.where(Session.status == status)
    if filter_date:
        day_start = datetime(filter_date.year, filter_date.month, filter_date.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        stmt = stmt.where(Session.created_at >= day_start, Session.created_at < day_end)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_session(db: AsyncSession, session_id: int) -> Session:
    stmt = (
        select(Session)
        .options(
            selectinload(Session.table),
            selectinload(Session.client),
            selectinload(Session.orders).selectinload(Order.items).selectinload(OrderItem.menu_item),
        )
        .where(Session.id == session_id)
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def create_session(db: AsyncSession, data: SessionCreate) -> Session:
    # Validate table exists
    table_result = await db.execute(select(Table).where(Table.id == data.table_id))
    table = table_result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Validate client exists
    client_result = await db.execute(select(Client).where(Client.id == data.client_id))
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if data.session_type == "active":
        if table.status != TableStatus.available:
            raise HTTPException(status_code=400, detail="Table is not available")
        session = Session(
            table_id=data.table_id,
            client_id=data.client_id,
            start_time=datetime.now(timezone.utc),
            status=SessionStatus.active,
        )
        table.status = TableStatus.occupied
    elif data.session_type == "reserved":
        if not data.reserved_start or not data.reserved_end:
            raise HTTPException(
                status_code=400, detail="Reservation requires start and end times"
            )
        session = Session(
            table_id=data.table_id,
            client_id=data.client_id,
            reserved_start=data.reserved_start,
            reserved_end=data.reserved_end,
            status=SessionStatus.reserved,
        )
        table.status = TableStatus.reserved
    else:
        raise HTTPException(status_code=400, detail="Invalid session type")

    db.add(session)
    await db.commit()
    await db.refresh(session)
    # Reload with relationships
    return await get_session(db, session.id)


async def end_session(db: AsyncSession, session_id: int, payment_method: str | None = None) -> Session:
    session = await get_session(db, session_id)

    if session.status != SessionStatus.active:
        raise HTTPException(status_code=400, detail="Only active sessions can be ended")

    now = datetime.now(timezone.utc)
    session.end_time = now
    session.payment_method = payment_method

    # Calculate table cost: round up to nearest 15 minutes
    if session.start_time:
        elapsed_seconds = (now - session.start_time).total_seconds()
        elapsed_hours = elapsed_seconds / 3600
        # Round up to nearest 0.25 hour (15 min)
        rounded_hours = math.ceil(elapsed_hours * 4) / 4
        session.table_cost = float(rounded_hours * float(session.table.hourly_rate))
    else:
        session.table_cost = 0

    # Sum all order item subtotals
    order_total = 0.0
    for order in session.orders:
        for item in order.items:
            order_total += float(item.subtotal)

    session.total_cost = session.table_cost + order_total
    session.status = SessionStatus.completed

    # Free the table
    table_result = await db.execute(select(Table).where(Table.id == session.table_id))
    table = table_result.scalar_one()
    table.status = TableStatus.available

    await db.commit()
    return await get_session(db, session_id)


async def cancel_session(db: AsyncSession, session_id: int) -> Session:
    session = await get_session(db, session_id)
    if session.status != SessionStatus.reserved:
        raise HTTPException(status_code=400, detail="Only reserved sessions can be cancelled")

    session.status = SessionStatus.cancelled

    # Free the table
    table_result = await db.execute(select(Table).where(Table.id == session.table_id))
    table = table_result.scalar_one()
    table.status = TableStatus.available

    await db.commit()
    return await get_session(db, session_id)


async def activate_session(db: AsyncSession, session_id: int) -> Session:
    session = await get_session(db, session_id)
    if session.status != SessionStatus.reserved:
        raise HTTPException(status_code=400, detail="Only reserved sessions can be activated")

    session.status = SessionStatus.active
    session.start_time = datetime.now(timezone.utc)

    # Table should already be reserved, set to occupied
    table_result = await db.execute(select(Table).where(Table.id == session.table_id))
    table = table_result.scalar_one()
    table.status = TableStatus.occupied

    await db.commit()
    return await get_session(db, session_id)
