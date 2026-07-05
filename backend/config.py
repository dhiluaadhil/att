import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    WHATSAPP_ACCESS_TOKEN: str
    WHATSAPP_PHONE_NUMBER_ID: str
    WHATSAPP_BUSINESS_ACCOUNT_ID: str
    BOSS_WHATSAPP_NUMBER: str
    
    JWT_SECRET: str
    DATABASE_URL: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    DEFAULT_ADMIN_USERNAME: str = "admin"
    DEFAULT_ADMIN_PASSWORD: str = "adminpassword123"
    
    PDF_OUTPUT_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure PDF output directory exists
os.makedirs(settings.PDF_OUTPUT_DIR, exist_ok=True)
