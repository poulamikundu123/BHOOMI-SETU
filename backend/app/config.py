from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./land_records.db"
    JWT_SECRET: str = "sih26018_jwt_secret_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    TESSERACT_PATH: str = "tesseract"
    DEMO_MODE: bool = True
    MAX_FILE_SIZE_MB: int = 50
    UPLOAD_DIR: str = "uploads"
    PROCESSED_DIR: str = "processed"
    FRONTEND_URL: str = "http://localhost:5173"
    GOOGLE_VISION_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        env_file = (".env", "../.env")
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)