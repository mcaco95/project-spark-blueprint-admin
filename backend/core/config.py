from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, validator, Field
from typing import Optional, Dict, Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Management Backend"
    API_V1_STR: str = "/v1"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "app_db"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True, always=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Optional[str]:
        if isinstance(v, str):
            return v
        if values.get("POSTGRES_USER") and values.get("POSTGRES_PASSWORD") and values.get("POSTGRES_SERVER") and values.get("POSTGRES_DB"):
            dsn = PostgresDsn.build(
                scheme="postgresql",
                user=str(values.get("POSTGRES_USER")),
                password=str(values.get("POSTGRES_PASSWORD")),
                host=str(values.get("POSTGRES_SERVER")),
                path=f"/{str(values.get('POSTGRES_DB'))}",
            )
            return str(dsn)
        return v

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

settings = Settings() 