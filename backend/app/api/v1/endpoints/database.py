from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()

@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Get Database Connection Health",
    description="Validates active connectivity to the PostgreSQL cloud/local database by running a simple query."
)
async def check_db_health(db: Session = Depends(get_db)):
    """
    Executes 'SELECT 1' to check connectivity to the DB.
    """
    try:
        # Run a simple query to assert the connection is active
        db.execute(text("SELECT 1"))
        return {
            "database": "connected",
            "status": "healthy"
        }
    except Exception as e:
        # If connection fails, return service unavailable
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
