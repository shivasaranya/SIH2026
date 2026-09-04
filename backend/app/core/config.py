from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    APP_NAME: str = "Sahayata"
    APP_ENV: str = "development"
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    DEBUG: bool = True
    VERSION: str = "0.1.0"
    SIH_CODE: str = "SIH26191"
    PILOT_STATE: str = "Andhra Pradesh"
    PILOT_STATE_CODE: str = "AP"

    # Data Paths
    PROJECT_ROOT_PATH: Path = PROJECT_ROOT
    DATA_DIR: Path = PROJECT_ROOT / "data"
    PROCESSED_ADMIN_DIR: Path = PROJECT_ROOT / "data" / "processed" / "admin"
    RAW_ADMIN_DIR: Path = PROJECT_ROOT / "data" / "raw" / "admin"
    PROCESSED_CENSUS_DIR: Path = PROJECT_ROOT / "data" / "processed" / "census"

    # CORS Origins
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database (PostgreSQL + PostGIS)
    DATABASE_URL: str = "postgresql://sahayata_user:sahayata_password@localhost:5432/sahayata_gis"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
