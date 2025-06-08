from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional

from app.services.huggingface_service import get_hf_models, download_hf_model
from app.schemas.model_schemas import HFModelResponse, HFModelDownloadStatus

router = APIRouter()

@router.get(
    "/",
    response_model=HFModelResponse,
    summary="List or search Hugging Face models",
    description="Fetch a list of models from the Hugging Face Hub, with optional search and pagination."
)
async def list_huggingface_models(
    search: Optional[str] = Query(None, description="Search term for models (e.g., 'bert', 'gpt2')."),
    limit: int = Query(12, ge=1, le=100, description="Number of models to return per page."), # Defaulting to 12 for a 3/4 column layout
    page: int = Query(1, ge=1, description="Page number of the results."),
    sort_by: Optional[str] = Query('downloads', description="Field to sort by (e.g., 'downloads', 'likes', 'lastModified')."),
    direction: Optional[str] = Query('desc', description="Sort direction: 'asc' or 'desc'.")
):
    """
    Retrieves a list of Hugging Face models, allowing for searching, pagination, and sorting.
    """
    # The service layer is expected to raise HTTPException on errors.
    models_data = await get_hf_models(
        search=search,
        limit=limit,
        page=page,
        sort_by=sort_by,
        direction=direction
    )
    return models_data

@router.post(
    "/{model_id:path}/download", # Uses :path to allow slashes in model_id
    response_model=HFModelDownloadStatus,
    summary="Download a Hugging Face model (simulation)",
    description="Triggers a simulated download process for the specified model ID."
)
async def download_huggingface_model(
    model_id: str = Path(..., description="ID of the model to download (e.g., 'bert-base-uncased' or 'google/flan-t5-small').", example="gpt2")
):
    """
    Simulates the download of a specified Hugging Face model.
    The `model_id` can be a simple name or a namespaced name like `org/model-name`.
    """
    # The service layer is expected to raise HTTPException on errors.
    download_status = await download_hf_model(model_id=model_id)
    return download_status

# Example of how model_id:path works:
# If you POST to /api/v1/hf-models/username/model-name/download
# model_id will be "username/model-name"
