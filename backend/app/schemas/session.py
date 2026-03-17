from datetime import datetime

from pydantic import BaseModel

from app.models.session import SessionStatus
from app.schemas.table import TableResponse
from app.schemas.client import ClientResponse


class SessionCreate(BaseModel):
    table_id: int
    client_id: int
    session_type: str = "active"  # "active" or "reserved"
    reserved_start: datetime | None = None
    reserved_end: datetime | None = None


class MenuItemBrief(BaseModel):
    id: int
    name: str
    category: str

    model_config = {"from_attributes": True}


class OrderItemBrief(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    unit_price: float
    subtotal: float
    menu_item: MenuItemBrief

    model_config = {"from_attributes": True}


class OrderBrief(BaseModel):
    id: int
    items: list[OrderItemBrief]
    created_at: datetime

    model_config = {"from_attributes": True}


class EndSessionRequest(BaseModel):
    payment_method: str


class SessionResponse(BaseModel):
    id: int
    table_id: int
    client_id: int
    start_time: datetime | None
    end_time: datetime | None
    reserved_start: datetime | None
    reserved_end: datetime | None
    status: SessionStatus
    table_cost: float
    total_cost: float
    payment_method: str | None = None
    table: TableResponse
    client: ClientResponse
    orders: list[OrderBrief]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SessionListResponse(BaseModel):
    id: int
    table_id: int
    client_id: int
    start_time: datetime | None
    end_time: datetime | None
    reserved_start: datetime | None
    reserved_end: datetime | None
    status: SessionStatus
    table_cost: float
    total_cost: float
    payment_method: str | None = None
    table: TableResponse
    client: ClientResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
