from datetime import datetime

from pydantic import BaseModel

from app.schemas.menu_item import MenuItemResponse


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int


class OrderCreate(BaseModel):
    session_id: int | None = None
    customer_name: str | None = None
    payment_method: str | None = None
    items: list[OrderItemCreate]


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    quantity: int
    unit_price: float
    subtotal: float
    menu_item: MenuItemResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    session_id: int | None
    customer_name: str | None
    payment_method: str | None = None
    items: list[OrderItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
