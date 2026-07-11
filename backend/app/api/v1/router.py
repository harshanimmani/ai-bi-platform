from fastapi import APIRouter
from app.api.v1.endpoints import health, database, datasets
api_router = APIRouter()

# Register sub-routers
api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(database.router, prefix="/database", tags=["Database Health"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["Dataset Management"])
