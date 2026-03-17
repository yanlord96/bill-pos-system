from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.session import Session, SessionStatus
from app.models.menu_item import MenuItem
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreate


async def get_orders_by_session(db: AsyncSession, session_id: int) -> list[Order]:
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
        .where(Order.session_id == session_id)
        .order_by(Order.created_at)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_all_orders(
    db: AsyncSession, standalone: bool | None = None
) -> list[Order]:
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
        .order_by(Order.created_at.desc())
    )
    if standalone is True:
        stmt = stmt.where(Order.session_id.is_(None))
    elif standalone is False:
        stmt = stmt.where(Order.session_id.is_not(None))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_order(db: AsyncSession, order_id: int) -> Order:
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


async def create_order(db: AsyncSession, data: OrderCreate) -> Order:
    # If session_id is provided, validate it
    if data.session_id is not None:
        session_result = await db.execute(
            select(Session).where(Session.id == data.session_id)
        )
        session = session_result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.status != SessionStatus.active:
            raise HTTPException(status_code=400, detail="Can only order on active sessions")

    if not data.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    order = Order(session_id=data.session_id, customer_name=data.customer_name, payment_method=data.payment_method)
    db.add(order)
    await db.flush()  # Get order.id

    for item_data in data.items:
        menu_result = await db.execute(
            select(MenuItem).where(MenuItem.id == item_data.menu_item_id)
        )
        menu_item = menu_result.scalar_one_or_none()
        if not menu_item:
            raise HTTPException(
                status_code=404, detail=f"Menu item {item_data.menu_item_id} not found"
            )
        if not menu_item.is_available:
            raise HTTPException(
                status_code=400, detail=f"Menu item '{menu_item.name}' is not available"
            )

        subtotal = float(menu_item.price) * item_data.quantity
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity,
            unit_price=float(menu_item.price),
            subtotal=subtotal,
        )
        db.add(order_item)

    await db.commit()
    return await get_order(db, order.id)
