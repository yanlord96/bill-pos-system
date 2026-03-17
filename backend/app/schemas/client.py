from datetime import datetime

from pydantic import BaseModel


class ClientCreate(BaseModel):
    name: str
    phone: str


class ClientUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None


class ClientResponse(BaseModel):
    id: int
    name: str
    phone: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
