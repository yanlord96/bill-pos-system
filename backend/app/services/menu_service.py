from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu_item import MenuItem, MenuCategory
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate


async def get_all_menu_items(
    db: AsyncSession, category: MenuCategory | None = None
) -> list[MenuItem]:
    stmt = select(MenuItem).order_by(MenuItem.category, MenuItem.name)
    if category:
        stmt = stmt.where(MenuItem.category == category)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_menu_item(db: AsyncSession, item_id: int) -> MenuItem:
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item


async def create_menu_item(db: AsyncSession, data: MenuItemCreate) -> MenuItem:
    item = MenuItem(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def update_menu_item(db: AsyncSession, item_id: int, data: MenuItemUpdate) -> MenuItem:
    item = await get_menu_item(db, item_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_menu_item(db: AsyncSession, item_id: int) -> None:
    item = await get_menu_item(db, item_id)
    await db.delete(item)
    await db.commit()
