from fastapi import APIRouter, status
from pydantic import BaseModel
from typing import Dict

router = APIRouter()

class HealthCheckResponse(BaseModel):
    status: str
    environment: str
    project_name: str
    debug: bool
    version: str

@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Get System Health",
    description="Returns the status of the API, current environment, and application metadata."
)
async def check_health() -> Dict[str, str | bool]:
    from app.core.config import settings
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "project_name": settings.PROJECT_NAME,
        "debug": settings.DEBUG,
        "version": "1.0.0"
    }
