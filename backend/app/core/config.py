import os
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Compute paths outside f-strings to prevent SyntaxError in Python <=3.11
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DEFAULT_DB_FILE = os.path.join(_BASE_DIR, "fixoboard.db").replace("\\", "/")
_DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{_DEFAULT_DB_FILE}"
_DEFAULT_UPLOAD_DIR = os.path.join(_BASE_DIR, "uploads")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "FixoBoard MMS"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    
    # Security & Tokens
    JWT_SECRET: str = "supersecret_fixoboard_production_key_change_in_env_2026_xyz"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for factory shift usage
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "https://fixoboard-frontend.onrender.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    # Database
    DATABASE_URL: str = _DEFAULT_DATABASE_URL
    
    # File Storage
    STORAGE_BACKEND: str = "local"
    LOCAL_UPLOAD_DIR: str = _DEFAULT_UPLOAD_DIR

    # AI PO Extraction & Google Gemini Vision Settings
    AI_PO_EXTRACTOR_ENABLED: bool = True
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            return _DEFAULT_DATABASE_URL
        url = v.strip()
        # Automatically transform Render/Heroku postgres:// or standard postgresql:// to postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        default_origins = [
            "https://fixoboard-frontend.onrender.com",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8000",
        ]
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                return default_origins
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                import json
                try:
                    parsed = json.loads(v_stripped)
                    if isinstance(parsed, list):
                        return [str(origin).strip().rstrip('/') for origin in parsed if str(origin).strip()]
                except Exception:
                    pass
            # Split comma-separated string and clean trailing slashes
            origins = [origin.strip().rstrip('/') for origin in v_stripped.split(",") if origin.strip()]
            for def_o in default_origins:
                if def_o not in origins:
                    origins.append(def_o)
            return origins
        elif isinstance(v, (list, set, tuple)):
            origins = [str(origin).strip().rstrip('/') for origin in v if str(origin).strip()]
            for def_o in default_origins:
                if def_o not in origins:
                    origins.append(def_o)
            return origins
        return default_origins

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        env = info.data.get("ENVIRONMENT", "development")
        if env == "production" and (not v or v == "supersecret_fixoboard_production_key_change_in_env_2026_xyz" or len(v) < 16):
            raise ValueError(
                "CRITICAL SECURITY CONFIGURATION: In production mode, a secure custom JWT_SECRET environment variable "
                "(at least 16 characters) must be configured in Render environment variables."
            )
        return v


settings = Settings()

os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
