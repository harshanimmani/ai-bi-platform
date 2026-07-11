from datetime import datetime
from typing import Optional, Dict
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class DatasetBase(BaseModel):
    """
    Base schemas attributes for datasets.
    """
    filename: str = Field(..., description="Original name of the uploaded file")

class DatasetResponse(DatasetBase):
    """
    Full dataset metadata response.
    """
    id: UUID
    user_id: Optional[UUID] = None
    storage_path: str
    file_size: int
    row_count: int
    col_count: int
    columns_metadata: Dict[str, str] = Field(
        ..., 
        description="Key-value mapping of column name to data type (e.g. {'Age': 'int64'})"
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
