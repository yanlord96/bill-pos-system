from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.schemas.session import SessionListResponse
from app.services import client_service, session_service

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/", response_model=list[ClientResponse])
async def list_clients(q: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    return await client_service.get_all_clients(db, q)


@router.post("/", response_model=ClientResponse, status_code=201)
async def create_client(data: ClientCreate, db: AsyncSession = Depends(get_db)):
    return await client_service.create_client(db, data)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, db: AsyncSession = Depends(get_db)):
    return await client_service.get_client(db, client_id)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(client_id: int, data: ClientUpdate, db: AsyncSession = Depends(get_db)):
    return await client_service.update_client(db, client_id, data)


@router.delete("/{client_id}", status_code=204)
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db)):
    await client_service.delete_client(db, client_id)
