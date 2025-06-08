from pydantic import BaseModel, HttpUrl # HttpUrl for URL validation
from typing import Optional, List # Added List

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


# New Schemas for Local Ollama Model Management

class OllamaLocalModelInfo(BaseModel):
    name: str
    modified_at: Optional[str] = None # Ollama's /api/tags provides 'modified_at'
    size: Optional[int] = None      # Ollama's /api/tags provides 'size'
    digest: Optional[str] = None    # Ollama's /api/tags provides 'digest'

class OllamaLocalModelsResponse(BaseModel):
    models: List[OllamaLocalModelInfo]

class OllamaPullRequest(BaseModel):
    model_name: str
    # ollama_url is included here as per the plan to specify which Ollama instance to use for the pull.
    ollama_url: str

class OllamaPullResponse(BaseModel):
    status: str  # e.g., "success", "failure", "pulling_started"
    message: str # Detailed message
