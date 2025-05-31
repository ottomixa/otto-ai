from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime

class HFModelBasic(BaseModel):
    id: str
    name: str | None = None
    creator: str | None = None
    iconUrl: Optional[HttpUrl] = None
    description: Optional[str] = None
    tags: List[str] = []
    downloads: int = 0
    lastModified: Optional[datetime] = None

class PaginatedHFModelsResponse(BaseModel):
    items: List[HFModelBasic]
    page: int
    limit: int
    total_pages: int # Simplified, would need more accurate calculation in a real app
    total_items: int # Simplified, would need more accurate calculation

class HFModelDetail(HFModelBasic): # Inherits from HFModelBasic
    pipeline_tag: Optional[str] = None
    cardData: Optional[Dict[str, Any]] = None # For full README/metadata
    siblings: List[Dict[str, Any]] = [] # For files in the repo
    # Add other detailed fields as needed, e.g. specific config, example inputs/outputs etc.

# Example for provider/tier information (can be expanded)
class TierInfo(BaseModel):
    tierId: str
    tierName: str
    tierIconClass: Optional[str] = None
    specs: Optional[str] = None
    pricePrediction: Optional[str] = None
    priceDetails: Optional[Dict[str, Any]] = None

class ProviderInfo(BaseModel):
    providerId: str
    providerName: str
    providerIconUrl: Optional[HttpUrl] = None
    notes: Optional[str] = None
    tiers: List[TierInfo] = []

class ModelProvidersResponse(BaseModel):
    model_id: str
    providers: List[ProviderInfo]

# Placeholder for error responses
class ErrorResponse(BaseModel):
    detail: str
