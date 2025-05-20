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
    # Default local database URL
    DEFAULT_LOCAL_DB_URL: str = "postgresql://postgres:postgres@localhost:5432/project_management"

    @validator("SQLALCHEMY_DATABASE_URI", pre=True, always=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        if isinstance(v, str):
            return v
        
        # First try DATABASE_URL (for Render)
        if os.environ.get("DATABASE_URL"):
            # Render provides PostgreSQL URLs starting with postgres://, but SQLAlchemy needs postgresql://
            db_url = os.environ.get("DATABASE_URL")
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql://", 1)
            return db_url
        
        # Then try SQLALCHEMY_DATABASE_URI (for local)
        if values.get("SQLALCHEMY_DATABASE_URI"):
            return values.get("SQLALCHEMY_DATABASE_URI")
        
        # Finally, use default local URL
        return values.get("DEFAULT_LOCAL_DB_URL")

    # JWT Settings
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "super-secret")  # Use env var or default
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "30"))

    # CORS - Allow specific origins in production
    BACKEND_CORS_ORIGINS: str = os.environ.get("BACKEND_CORS_ORIGINS", "*")

    # Environment flag
    IS_PRODUCTION: bool = os.environ.get("RENDER", "0") == "1"
    DEBUG: bool = not IS_PRODUCTION

    class Config:
        case_sensitive = True
        env_file = ".env_backend"
        env_file_encoding = 'utf-8'

settings = Settings(_env_file=None if os.environ.get("RENDER") else ".env_backend") 