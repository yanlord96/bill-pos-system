from datetime import datetime

from pydantic import BaseModel

from app.models.menu_item import MenuCategory


class MenuItemCreate(BaseModel):
    name: str
    category: MenuCategory
    price: float
    is_available: bool = True


class MenuItemUpdate(BaseModel):
    name: str | None = None
    category: MenuCategory | None = None
    price: float | None = None
    is_available: bool | None = None


class MenuItemResponse(BaseModel):
    id: int
    name: str
    category: MenuCategory
    price: float
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
