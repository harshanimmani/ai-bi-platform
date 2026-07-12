import uuid
from sqlalchemy import Column, String, DateTime, Uuid
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    """
    SQLAlchemy model representing the users table.
    """
    __tablename__ = "users"

    # Native PostgreSQL UUID primary key
    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False
    )
    
    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    
    full_name = Column(
        String(255),
        nullable=True
    )
    
    # Nullable since Clerk authentication handles password hashing in production
    password_hash = Column(
        String(255),
        nullable=True
    )
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
