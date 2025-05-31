from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    hf_token: str | None = os.getenv("HF_TOKEN")
    # In a real app, you might add more config like API base URLs, default timeouts, etc.

    class Config:
        env_file = ".env" # Load from .env file if present
        extra = "ignore"  # Ignore extra fields from .env

settings = Settings()
