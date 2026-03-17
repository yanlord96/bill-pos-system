from fastapi import HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate


async def get_all_clients(db: AsyncSession, q: str | None = None) -> list[Client]:
    stmt = select(Client).order_by(Client.name)
    if q:
        stmt = stmt.where(
            or_(Client.name.ilike(f"%{q}%"), Client.phone.ilike(f"%{q}%"))
        )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_client(db: AsyncSession, client_id: int) -> Client:
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


async def create_client(db: AsyncSession, data: ClientCreate) -> Client:
    existing = await db.execute(select(Client).where(Client.phone == data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    client = Client(**data.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


async def update_client(db: AsyncSession, client_id: int, data: ClientUpdate) -> Client:
    client = await get_client(db, client_id)
    update_data = data.model_dump(exclude_unset=True)
    if "phone" in update_data:
        existing = await db.execute(
            select(Client).where(Client.phone == update_data["phone"], Client.id != client_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already registered")
    for key, value in update_data.items():
        setattr(client, key, value)
    await db.commit()
    await db.refresh(client)
    return client


async def delete_client(db: AsyncSession, client_id: int) -> None:
    client = await get_client(db, client_id)
    await db.delete(client)
    await db.commit()
