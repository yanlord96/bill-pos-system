from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.models.menu_item import MenuCategory
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemResponse
from app.services import menu_service

router = APIRouter(prefix="/menu", tags=["Menu"])


@router.get("/", response_model=list[MenuItemResponse])
async def list_menu_items(
    category: MenuCategory | None = Query(None), db: AsyncSession = Depends(get_db)
):
    return await menu_service.get_all_menu_items(db, category)


@router.post("/", response_model=MenuItemResponse, status_code=201)
async def create_menu_item(data: MenuItemCreate, db: AsyncSession = Depends(get_db)):
    return await menu_service.create_menu_item(db, data)


@router.get("/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(item_id: int, db: AsyncSession = Depends(get_db)):
    return await menu_service.get_menu_item(db, item_id)


@router.put("/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(item_id: int, data: MenuItemUpdate, db: AsyncSession = Depends(get_db)):
    return await menu_service.update_menu_item(db, item_id, data)


@router.delete("/{item_id}", status_code=204)
async def delete_menu_item(item_id: int, db: AsyncSession = Depends(get_db)):
    await menu_service.delete_menu_item(db, item_id)
