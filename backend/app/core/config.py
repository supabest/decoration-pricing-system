"""应用配置管理"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "装修工程AI套价系统"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = "change-me"

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/pricing"
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI / LLM
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    EMBEDDING_MODEL: str = "BAAI/bge-large-zh-v1.5"
    VECTOR_DIM: int = 768

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Task Queue
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024
    UPLOAD_DIR: str = "./uploads"

    # Price Defaults
    DEFAULT_PROFIT_RATE: float = 7.0
    DEFAULT_MANAGEMENT_RATE: float = 5.0
    DEFAULT_TAX_RATE: float = 9.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
        case_sensitive = True


settings = Settings()
