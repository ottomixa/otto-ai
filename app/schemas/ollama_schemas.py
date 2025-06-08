from pydantic import BaseModel, HttpUrl # HttpUrl for URL validation
from typing import Optional

class OllamaURL(BaseModel): # Helper for more specific URL validation
    # Using str for now as HttpUrl can be strict; service layer handles prepending http if needed.
    # url: HttpUrl
    url: str

class OllamaConnectionRequest(BaseModel):
    # url: HttpUrl # Frontend sends a string, validation can happen here or in service
    url: str

    # Example if we wanted to use the helper (requires frontend to send object like {"ollama_url": {"url": "..."}})
    # ollama_url_details: OllamaURL
    # For simplicity, keeping it as a direct string from frontend request body: {"url": "user_provided_url"}


class OllamaConnectionResponse(BaseModel):
    status: str  # e.g., "success" or "failure"
    message: str # Detailed message about the connection attempt
