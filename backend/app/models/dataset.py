import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base

class Dataset(Base):
    """
    SQLAlchemy model representing the datasets table.
    Tracks metadata and storage references for uploaded business files (CSV/Excel).
    """
    __tablename__ = "datasets"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False
    )
    
    # Nullable until auth logic is added in Module 6
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    filename = Column(
        String(255),
        nullable=False
    )
    
    storage_path = Column(
        String(512),
        nullable=False
    )
    
    file_size = Column(
        Integer,
        nullable=False
    )
    
    row_count = Column(
        Integer,
        nullable=False,
        default=0
    )
    
    col_count = Column(
        Integer,
        nullable=False,
        default=0
    )
    
    # Store schema metadata: column names mapped to their pandas data types
    columns_metadata = Column(
        JSON,
        nullable=False,
        default=dict
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
