"""
Intelligent Shopping Agentic AI – Configuration
IBM Cloud backend: IBM Databases for PostgreSQL + IBM watsonx.ai
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "changeme"
    DEBUG: bool = True

    # ── IBM Databases for PostgreSQL ──────────────────────────────────────────
    # Set DATABASE_URL to your IBM Cloud PostgreSQL connection string.
    # Format: postgresql+asyncpg://user:pass@host:port/db?ssl=require
    DATABASE_URL: str = "postgresql+asyncpg://shopping_user:shopping_pass@localhost:5432/shopping_ai_db"
    # Set DB_SSL=true when connecting to IBM Cloud (enforces SSL/TLS)
    DB_SSL: bool = False

    # ── IBM watsonx.ai ────────────────────────────────────────────────────────
    WATSONX_API_KEY: str = "dsu7tVLUTDPIWqmRU7yDfN9IqwrvlUpZUgm_i37FOmTi"
    WATSONX_PROJECT_ID: str = "7396b694-7544-4ab3-a0ef-98f74b1ea489"
    WATSONX_URL: str = "https://au-syd.ml.cloud.ibm.com"
    WATSONX_MODEL_ID: str = "meta-llama/llama-3-3-70b-instruct"

    # ── E-commerce APIs (optional) ────────────────────────────────────────────
    RAPIDAPI_KEY: str = ""
    AMAZON_AFFILIATE_KEY: str = ""
    EBAY_APP_ID: str = ""

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # ── JWT ───────────────────────────────────────────────────────────────────
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── File uploads ──────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "./uploads"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
