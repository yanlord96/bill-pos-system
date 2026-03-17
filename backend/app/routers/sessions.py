from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.models.session import SessionStatus
from app.schemas.session import SessionCreate, SessionResponse, SessionListResponse, EndSessionRequest
from app.services import session_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("/", response_model=list[SessionListResponse])
async def list_sessions(
    status: SessionStatus | None = Query(None),
    filter_date: date | None = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db),
):
    return await session_service.get_all_sessions(db, status, filter_date=filter_date)


@router.post("/", response_model=SessionResponse, status_code=201)
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db)):
    return await session_service.create_session(db, data)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    return await session_service.get_session(db, session_id)


@router.patch("/{session_id}/end", response_model=SessionResponse)
async def end_session(session_id: int, data: EndSessionRequest, db: AsyncSession = Depends(get_db)):
    return await session_service.end_session(db, session_id, payment_method=data.payment_method)


@router.patch("/{session_id}/cancel", response_model=SessionResponse)
async def cancel_session(session_id: int, db: AsyncSession = Depends(get_db)):
    return await session_service.cancel_session(db, session_id)


@router.patch("/{session_id}/start", response_model=SessionResponse)
async def activate_session(session_id: int, db: AsyncSession = Depends(get_db)):
    return await session_service.activate_session(db, session_id)
