from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, validator, Field
from typing import Optional, Dict, Any
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Management Backend"
    API_V1_STR: str = "/v1"

    # Database
    DATABASE_URL: Optional[str] = None
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True, always=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Optional[str]:
        if isinstance(v, str):
            return v
        # Use DATABASE_URL if available
        if values.get("DATABASE_URL"):
            return values.get("DATABASE_URL")
        return None

    # JWT Settings
    JWT_SECRET_KEY: str = "super-secret"  # CHANGE THIS IN PRODUCTION!
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS - simple setup for now
    BACKEND_CORS_ORIGINS: str = "*" # Should be more restrictive in production

    class Config:
        case_sensitive = True
        env_file = ".env_backend" # Load from .env_backend file
        env_file_encoding = 'utf-8'

settings = Settings(_env_file=None)  # Prevent loading from .env file to ensure environment variables take precedence 