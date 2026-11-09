"""Application configuration via pydantic-settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: str = "development"
    PORT: int = 4000
    CLIENT_ORIGIN: str = "http://localhost:5173"

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "civicfix"
    DB_PASSWORD: str = "civicfix"
    DB_NAME: str = "civicfix"
    DB_NAME_TEST: str = "civicfix_test"
    DB_SSL: bool = False
    DB_ROOT_USER: str = "root"
    DB_ROOT_PASSWORD: str = ""

    JWT_SECRET: str = "change-me-long-random-civicfix-secret-key-32-bytes"
    JWT_EXPIRES_IN: str = "7d"
    COOKIE_SAMESITE: str = "lax"

    STORAGE_DRIVER: str = "local"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    MAX_UPLOAD_MB: int = 5

    AI_PROVIDER: str = "groq"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_TIMEOUT_MS: int = 8000

    DUP_RADIUS_M: float = 150.0
    DUP_LOOKBACK_DAYS: int = 30
    DUP_MAX_CANDIDATES: int = 5
    DUP_MIN_SCORE: float = 0.35
    REOPEN_WINDOW_DAYS: int = 14
    VERIFICATION_OVERDUE_DAYS: int = 7
    MAX_REPORTS_PER_DAY: int = 10

    SEED_DEMO_USERS: bool = True
    DEMO_CENTER_LAT: float = 12.9716
    DEMO_CENTER_LNG: float = 77.5946


settings = Settings()
