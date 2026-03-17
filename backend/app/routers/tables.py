from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.table import TableCreate, TableUpdate, TableStatusUpdate, TableResponse
from app.services import table_service

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.get("/", response_model=list[TableResponse])
async def list_tables(db: AsyncSession = Depends(get_db)):
    return await table_service.get_all_tables(db)


@router.post("/", response_model=TableResponse, status_code=201)
async def create_table(data: TableCreate, db: AsyncSession = Depends(get_db)):
    return await table_service.create_table(db, data)


@router.get("/{table_id}", response_model=TableResponse)
async def get_table(table_id: int, db: AsyncSession = Depends(get_db)):
    return await table_service.get_table(db, table_id)


@router.put("/{table_id}", response_model=TableResponse)
async def update_table(table_id: int, data: TableUpdate, db: AsyncSession = Depends(get_db)):
    return await table_service.update_table(db, table_id, data)


@router.delete("/{table_id}", status_code=204)
async def delete_table(table_id: int, db: AsyncSession = Depends(get_db)):
    await table_service.delete_table(db, table_id)


@router.patch("/{table_id}/status", response_model=TableResponse)
async def update_status(table_id: int, data: TableStatusUpdate, db: AsyncSession = Depends(get_db)):
    return await table_service.update_table_status(db, table_id, data)
