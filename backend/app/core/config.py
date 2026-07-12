from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application settings using Pydantic Settings management.
    Loads values from environment variables or .env file.
    """
    PROJECT_NAME: str = "AI Business Intelligence Platform"
    ENVIRONMENT: str = "local"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = "sqlite:///./test.db"

    # Auth (Clerk)
    CLERK_API_KEY: str = ""
    CLERK_JWT_KEY: str = ""

    # AI (OpenAI)
    OPENAI_API_KEY: str = ""

    # Pydantic Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
