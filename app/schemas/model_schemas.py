from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime

class HFModelBasic(BaseModel):
    id: str
    name: str | None = None
    creator: str | None = None
    iconUrl: Optional[HttpUrl | str] = None # Allow string for local/relative paths too
    description: Optional[str] = None
    tags: List[str] = []
    downloads: int = 0
    lastModified: Optional[datetime] = None

class HFModelDetail(HFModelBasic): # Inherits from HFModelBasic
    pipeline_tag: Optional[str] = None
    cardData: Optional[Dict[str, Any]] = None # For full README/metadata
    siblings: List[str] = [] # List of filenames
    # Add other detailed fields as needed, e.g. specific config, example inputs/outputs etc.

# Placeholder for other schemas that might be needed by other services or parts of the app
# For example, if you had provider schemas:
# class TierInfo(BaseModel):
#     tierId: str
#     tierName: str
#     # ... other fields

# class ProviderInfo(BaseModel):
#     providerId: str
#     providerName: str
#     # ... other fields

# class ModelProvidersResponse(BaseModel):
#     model_id: str
#     providers: List[ProviderInfo]

class ErrorResponse(BaseModel):
    detail: str
