from huggingface_hub import HfApi, ModelInfo, CardData
from .schemas import HFModelBasic, HFModelDetail, PaginatedHFModelsResponse
from .config import settings
from typing import List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class HuggingFaceAPIService:
    def __init__(self, hf_token: Optional[str] = settings.hf_token):
        self.hf_api = HfApi(token=hf_token)

    def _extract_name_from_id(self, model_id: str) -> str:
        """Extracts a more readable name from the model ID if possible."""
        parts = model_id.split('/')
        return parts[-1].replace('-', ' ').replace('_', ' ').title() if len(parts) > 0 else model_id

    def _transform_model_info(self, model_info: ModelInfo, include_details: bool = False) -> HFModelBasic | HFModelDetail:
        """Transforms ModelInfo from huggingface_hub to our schema."""
        
        name = self._extract_name_from_id(model_info.id)
        creator = model_info.author if model_info.author else (model_info.id.split('/')[0] if '/' in model_info.id else "Unknown")
        
        description = None
        if model_info.cardData and isinstance(model_info.cardData, CardData):
            try:
                # Try to get description from common fields in cardData (this can vary greatly)
                if model_info.cardData.get('model-summary'):
                    description = model_info.cardData.get('model-summary')
                elif model_info.cardData.get('model_description'):
                     description = model_info.cardData.get('model_description')
                elif model_info.cardData.get('description'): # A more generic fallback
                    description = model_info.cardData.get('description')
                if isinstance(description, dict): # Sometimes it's a dict by language
                    description = description.get('en', next(iter(description.values()), "No description available."))

            except Exception as e:
                logger.warning(f"Could not parse cardData for description for {model_info.id}: {e}")
                description = "Description not available or parsing failed."


        # Placeholder for icon URL - this would require a more robust solution
        # e.g. mapping known creators/models to icons, or a default icon.
        icon_url_map = {
            "meta": "icons/llama-icon.png", # Assuming frontend path
            "mistralai": "icons/mistral-icon.png",
            # Add more known mappings
        }
        icon_path = icon_url_map.get(creator.lower(), "icons/default-model-icon.png")
        # This icon_url needs to be resolvable by the frontend, so it might be a relative path
        # or an absolute URL if icons are hosted elsewhere. For now, assume relative to frontend.

        common_data = {
            "id": model_info.id,
            "name": name,
            "creator": creator,
            "iconUrl": icon_path, # Placeholder
            "description": description if description else "No description provided.",
            "tags": model_info.tags if model_info.tags else [],
            "downloads": model_info.downloads if model_info.downloads else 0,
            "lastModified": model_info.last_modified if model_info.last_modified else None,
        }

        if include_details:
            return HFModelDetail(
                **common_data,
                pipeline_tag=model_info.pipeline_tag,
                cardData=model_info.cardData if model_info.cardData else None,
                siblings=[{"rfilename": s.rfilename, "size": s.size} for s in model_info.siblings] if model_info.siblings else []
            )
        return HFModelBasic(**common_data)

    async def list_models_from_hf(
        self,
        search: Optional[str] = None,
        sort: str = "downloads",
        direction: str = "desc", # "asc" or "desc"
        limit: int = 10,
        page: int = 1,
    ) -> PaginatedHFModelsResponse:
        """
        Lists models from Hugging Face Hub with simplified pagination.
        Note: True server-side pagination with huggingface_hub is tricky as list_models
        doesn't directly support skip/offset. We fetch more and slice.
        A more robust solution might involve cursors if the API supported it,
        or fetching all and caching for smaller datasets.
        """
        fetch_limit = page * limit # Fetch enough items to cover up to the current page
        
        try:
            models_info_iter = self.hf_api.list_models(
                search=search,
                sort=sort,
                direction=-1 if direction == "desc" else 1,
                limit=fetch_limit, # Fetch up to the number needed for the current page
                full=False, # Fetch ModelInfo, not full details yet for list view
                cardData=True # Fetch cardData for description
            )
            
            all_models = list(models_info_iter)
            
            # Slice for the current page
            start_index = (page - 1) * limit
            end_index = start_index + limit
            page_items_info = all_models[start_index:end_index]

            transformed_items = [self._transform_model_info(m) for m in page_items_info]
            
            # Simplified total_items and total_pages for this conceptual example
            # In a real app, if search is active, total_items might be len(all_models) up to a certain cap,
            // or if no search, it could be a very large number / a capped query.
            # For now, assume all_models contains up to fetch_limit if search is used, or just a large number otherwise
            total_items_estimation = len(all_models) if search else 5000 # Arbitrary large number if no search
            if search and len(all_models) < fetch_limit: # If search returned fewer than fetch_limit
                total_items_estimation = len(all_models)


            return PaginatedHFModelsResponse(
                items=transformed_items,
                page=page,
                limit=limit,
                total_pages=(total_items_estimation + limit -1) // limit, # Ceiling division
                total_items=total_items_estimation 
            )
        except Exception as e:
            logger.error(f"Error listing models from Hugging Face: {e}")
            # In a real app, you might raise a custom HTTPException here
            return PaginatedHFModelsResponse(items=[], page=page, limit=limit, total_pages=0, total_items=0)


    async def get_model_details_from_hf(self, model_id: str) -> Optional[HFModelDetail]:
        """Gets detailed information for a specific model."""
        try:
            model_info = self.hf_api.model_info(repo_id=model_id, files_metadata=True) # Get file listings
            if model_info:
                return self._transform_model_info(model_info, include_details=True)
        except Exception as e: # More specific exceptions (e.g., RepoNotFound) can be caught
            logger.error(f"Error fetching model details for {model_id}: {e}")
        return None

# Mock service for providers - in a real app, this might come from a DB or another API
class MockProviderService:
    def __init__(self):
        self.mock_provider_data = {
            "llama2-7b-chat": [
                {
                    "providerId": "replicate", "providerName": "Replicate", 
                    "providerIconUrl": "icons/replicate-logo.png",
                     "notes": "Fast cold starts, pay-per-second billing.",
                    "tiers": [
                        {"tierId": "replicate-t4", "tierName": "Standard (NVIDIA T4)", "specs": "NVIDIA T4 GPU, 16GB VRAM", "pricePrediction": "Est. $0.0015 / 1k tokens"},
                    ]
                },
                {
                    "providerId": "supercompute-cloud", "providerName": "SuperCompute Cloud", 
                    "providerIconUrl": "icons/supercompute-logo.png",
                    "notes": "Offers sustained usage discounts.",
                    "tiers": [
                        {"tierId": "sc-a100-large", "tierName": "Large (NVIDIA A100)", "specs": "NVIDIA A100 GPU, 40GB VRAM", "pricePrediction": "Est. $1.20 / hour"},
                        {"tierId": "sc-a100-xlarge", "tierName": "XLarge (NVIDIA A100x2)", "specs": "2x NVIDIA A100 GPU, 80GB VRAM", "pricePrediction": "Est. $2.30 / hour"},
                    ]
                }
            ],
            "mistral-7b-instruct": [
                 {
                    "providerId": "replicate", "providerName": "Replicate", 
                    "providerIconUrl": "icons/replicate-logo.png",
                    "notes": "Excellent for Mistral models.",
                    "tiers": [
                        {"tierId": "replicate-mistral-t4", "tierName": "Standard (NVIDIA T4)", "specs": "NVIDIA T4 GPU, 16GB VRAM", "pricePrediction": "Est. $0.0007 / 1k tokens"},
                    ]
                }
            ],
             "codellama-13b": [] # No providers for this model in mock data
        }

    async def get_providers_for_model(self, model_id: str) -> List[dict]:
        return self.mock_provider_data.get(model_id, [])

hf_service = HuggingFaceAPIService()
provider_service = MockProviderService()
