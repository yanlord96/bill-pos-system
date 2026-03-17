from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.order import OrderCreate, OrderResponse
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/", response_model=list[OrderResponse])
async def list_orders(
    session_id: int | None = Query(None),
    standalone: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if session_id is not None:
        return await order_service.get_orders_by_session(db, session_id)
    return await order_service.get_all_orders(db, standalone)


@router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(data: OrderCreate, db: AsyncSession = Depends(get_db)):
    return await order_service.create_order(db, data)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    return await order_service.get_order(db, order_id)
