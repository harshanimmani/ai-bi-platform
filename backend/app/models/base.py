# Share SQLAlchemy Base and import all ORM models here
# This allows Alembic to auto-detect all models by importing app.models.base.Base
from app.core.database import Base
from app.models.user import User

__all__ = ["Base", "User"]
