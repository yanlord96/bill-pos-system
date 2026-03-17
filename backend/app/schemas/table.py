from datetime import datetime

from pydantic import BaseModel

from app.models.table import TableStatus


class TableCreate(BaseModel):
    number: int
    hourly_rate: float
    status: TableStatus = TableStatus.available


class TableUpdate(BaseModel):
    number: int | None = None
    hourly_rate: float | None = None
    status: TableStatus | None = None


class TableStatusUpdate(BaseModel):
    status: TableStatus


class TableResponse(BaseModel):
    id: int
    number: int
    status: TableStatus
    hourly_rate: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
