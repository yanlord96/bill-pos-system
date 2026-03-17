from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.table import Table, TableStatus
from app.schemas.table import TableCreate, TableUpdate, TableStatusUpdate


async def get_all_tables(db: AsyncSession) -> list[Table]:
    result = await db.execute(select(Table).order_by(Table.number))
    return list(result.scalars().all())


async def get_table(db: AsyncSession, table_id: int) -> Table:
    result = await db.execute(select(Table).where(Table.id == table_id))
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table


async def create_table(db: AsyncSession, data: TableCreate) -> Table:
    existing = await db.execute(select(Table).where(Table.number == data.number))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Table number already exists")
    table = Table(**data.model_dump())
    db.add(table)
    await db.commit()
    await db.refresh(table)
    return table


async def update_table(db: AsyncSession, table_id: int, data: TableUpdate) -> Table:
    table = await get_table(db, table_id)
    update_data = data.model_dump(exclude_unset=True)
    if "number" in update_data:
        existing = await db.execute(
            select(Table).where(Table.number == update_data["number"], Table.id != table_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Table number already exists")
    for key, value in update_data.items():
        setattr(table, key, value)
    await db.commit()
    await db.refresh(table)
    return table


async def delete_table(db: AsyncSession, table_id: int) -> None:
    table = await get_table(db, table_id)
    await db.delete(table)
    await db.commit()


async def update_table_status(db: AsyncSession, table_id: int, data: TableStatusUpdate) -> Table:
    table = await get_table(db, table_id)
    table.status = data.status
    await db.commit()
    await db.refresh(table)
    return table
