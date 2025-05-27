from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional, List
from ..schemas import PaginatedHFModelsResponse, HFModelDetail, ModelProvidersResponse, ErrorResponse
from ..services import hf_service, provider_service # Using instances from services.py
import logging

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/hf-models",
    tags=["Hugging Face Models"],
    responses={404: {"description": "Not found", "model": ErrorResponse}}
)

@router.get("/", response_model=PaginatedHFModelsResponse)
async def list_hf_models(
    search: Optional[str] = Query(None, description="Search term to filter models by name or description."),
    limit: int = Query(10, ge=1, le=100, description="Number of models to return per page."),
    page: int = Query(1, ge=1, description="Page number of the results."),
    sort: str = Query("downloads", description="Field to sort by (e.g., 'downloads', 'lastModified', 'likes')."),
    direction: str = Query("desc", pattern="^(asc|desc)$", description="Sort direction: 'asc' or 'desc'.")
):
    """
    List models from the Hugging Face Hub.
    Supports basic search, pagination, and sorting.
    """
    try:
        paginated_response = await hf_service.list_models_from_hf(
            search=search,
            sort=sort,
            direction=direction,
            limit=limit,
            page=page
        )
        return paginated_response
    except Exception as e:
        logger.error(f"Error in list_hf_models endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred while fetching models.")

@router.get(
    "/{model_author}/{model_name}",
    response_model=HFModelDetail,
    responses={404: {"model": ErrorResponse, "description": "Model not found."}}
)
async def get_hf_model_detail(
    model_author: str = Path(..., description="The author/organization of the model (e.g., 'meta-llama')."),
    model_name: str = Path(..., description="The name of the model (e.g., 'Llama-2-7b-chat-hf').")
):
    """
    Get detailed information for a specific Hugging Face model.
    """
    model_id = f"{model_author}/{model_name}"
    try:
        model_detail = await hf_service.get_model_details_from_hf(model_id)
        if model_detail is None:
            raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")
        return model_detail
    except HTTPException:
        raise # Re-raise HTTPException directly (e.g. 404)
    except Exception as e:
        logger.error(f"Error in get_hf_model_detail endpoint for {model_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching details for model '{model_id}'.")


@router.get(
    "/{model_author}/{model_name}/providers",
    response_model=ModelProvidersResponse,
    responses={404: {"model": ErrorResponse, "description": "Providers for model not found or model does not exist."}}
)
async def get_model_providers(
    model_author: str = Path(..., description="The author/organization of the model."),
    model_name: str = Path(..., description="The name of the model.")
):
    """
    Get available providers and tiers for a specific Hugging Face model (Mocked Data).
    """
    model_id = f"{model_author}/{model_name}"
    # First, check if the model itself exists to give a more accurate 404
    # This is a conceptual check; in a real system, you might integrate this more deeply
    # or rely on the provider service to handle "model not found" implicitly.
    # model_exists = await hf_service.get_model_details_from_hf(model_id) # Optional: check model existence first
    # if not model_exists:
    #     raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found, so no providers can be listed.")

    try:
        providers = await provider_service.get_providers_for_model(model_id)
        # The mock service currently returns [] if model_id not found in its keys.
        # If it could raise an error for "model_id not found", that would be handled in the except block.
        # For now, if providers is empty, it means no providers are configured for this model_id.
        return ModelProvidersResponse(model_id=model_id, providers=providers)
    except Exception as e: # Catch any unexpected errors from the provider service
        logger.error(f"Error in get_model_providers endpoint for {model_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching providers for model '{model_id}'.")
