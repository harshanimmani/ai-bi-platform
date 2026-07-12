from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create database engine
# pool_pre_ping=True ensures we test connections before using them
# to avoid stale connection errors (highly recommended for Supabase/serverless)
engine_kwargs = {"pool_pre_ping": True}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db() -> Generator:
    """
    FastAPI dependency that provides a transactional database session.
    Closes the session after the request lifecycle is complete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
