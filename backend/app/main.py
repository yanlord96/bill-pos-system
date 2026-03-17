from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import tables, clients, menu, sessions, orders, dashboard, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Bill House - Billiard POS", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
for router in [auth.router, tables.router, clients.router, menu.router, sessions.router, orders.router, dashboard.router]:
    app.include_router(router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
