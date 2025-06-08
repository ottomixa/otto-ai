from pydantic import BaseModel, Field
from typing import List, Optional

class HFModel(BaseModel):
    id: str
    name: str
    iconUrl: Optional[str] = None
    creator: Optional[str] = None
    description: Optional[str] = Field(None, description="Typically the pipeline_tag or a short model description.")
    tags: Optional[List[str]] = Field(default_factory=list)
    lastModified: Optional[str] = Field(None, alias="lastModified", description="Last modified timestamp from the API.")
    downloads: Optional[int] = Field(None, description="Number of downloads from the API.")
    likes: Optional[int] = Field(None, description="Number of likes from the API.")
    private: Optional[bool] = Field(None, description="Whether the model is private.")

    class Config:
        populate_by_name = True # Allows using alias like 'lastModified' for field last_modified if we had that
        # For this schema, field names match keys, so alias isn't strictly needed yet, but good practice.


class HFModelResponse(BaseModel):
    items: List[HFModel]
    total: int # In our current service, this is the count of items in the current batch, not the overall total available.
    page: int
    limit: int


class HFModelDownloadStatus(BaseModel):
    message: str
    model_id: str = Field(..., alias="modelId") # Assuming frontend might expect modelId
    download_path: Optional[str] = Field(None, alias="downloadPath")

    class Config:
        populate_by_name = True # Allows using alias
        json_schema_extra = {
            "example": {
                "message": "Download simulation started for gpt2. Check server logs.",
                "modelId": "gpt2",
                "downloadPath": "downloaded_models/gpt2"
            }
        }
