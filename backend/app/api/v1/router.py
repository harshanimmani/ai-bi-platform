from fastapi import APIRouter
from app.api.v1.endpoints import health, database

api_router = APIRouter()

# Register sub-routers
api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(database.router, prefix="/database", tags=["Database Health"])
