from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class UserBase(BaseModel):
    """
    Shared attributes for user schemas.
    """
    email: str = Field(..., description="The user's email address")
    full_name: Optional[str] = Field(None, description="The user's full name")

class UserCreate(UserBase):
    """
    Schema for creating a user.
    """
    password: Optional[str] = Field(
        None, 
        min_length=8, 
        description="The user's password (optional if Clerk auth is used)"
    )

class UserUpdate(BaseModel):
    """
    Schema for updating user attributes.
    All attributes are optional.
    """
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    """
    Schema for user API response.
    Includes database-generated fields.
    """
    id: UUID
    created_at: datetime
    updated_at: datetime

    # Pydantic v2 configuration to read ORM models automatically
    model_config = ConfigDict(from_attributes=True)
