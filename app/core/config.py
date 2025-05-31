from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MODEL_DOWNLOAD_DIRECTORY: str = "downloaded_models/"

settings = Settings()
