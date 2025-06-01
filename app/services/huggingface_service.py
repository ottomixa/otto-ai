# Full content for app/services/huggingface_service.py
import os
from fastapi import HTTPException
from app.core.config import settings
from huggingface_hub import list_models # Keep this
from huggingface_hub.hf_api import ModelInfo # Keep this
import datetime

async def get_hf_models(search: str = None, limit: int = 10, page: int = 1, sort_by: str = 'downloads', direction: str = 'desc') -> dict:
    try:
        sort_field = sort_by if sort_by in ['downloads', 'likes', 'lastModified'] else 'lastModified'
        sort_direction = -1 if direction == 'desc' else 1

        # The fetch_api_limit logic was changed in the prompt compared to previous version.
        # Previous was: api_fetch_limit = page * limit
        # New prompt for this step has: fetch_api_limit = min((page + 1) * limit, 200)
        # This change makes sense to potentially fetch one page ahead for 'total' calculation or lookahead.
        # Let's stick to what's in the prompt for this step.
        fetch_api_limit = min((page + 1) * limit, 200)

        search_term_for_api = search if search and search.strip() else None

        model_infos_iterator = list_models(
            search=search_term_for_api, # MODIFIED: direct search string
            sort=sort_field,
            direction=sort_direction,
            limit=fetch_api_limit,
            full=True,
            cardData=False
        )

        all_models_fetched_from_api = list(model_infos_iterator)

        start_index = (page - 1) * limit
        end_index = start_index + limit
        models_for_current_page = all_models_fetched_from_api[start_index:end_index]

        transformed_models = []
        for model_info in models_for_current_page:
            if isinstance(model_info, ModelInfo):
                tags_list = model_info.tags if model_info.tags else []
                processed_tags = [str(tag) for tag in tags_list if isinstance(tag, (str, int, float))]

                transformed_models.append({
                    "id": model_info.modelId,
                    "name": model_info.modelId,
                    "creator": model_info.author,
                    "private": model_info.private,
                    "downloads": model_info.downloads,
                    "likes": model_info.likes,
                    "lastModified": model_info.lastModified.isoformat() if isinstance(model_info.lastModified, datetime.datetime) else str(model_info.lastModified),
                    "tags": processed_tags,
                    "description": model_info.pipeline_tag,
                    "iconUrl": None
                })

        # The 'total' field in the response.
        # Based on the prompt: "total: int (Reflecting the count of items in the current response, as per service)"
        # However, previous service had: "total": len(all_models_fetched_from_api)
        # The prompt for THIS step says: current_page_item_count = len(transformed_models)
        # and then "total": current_page_item_count
        # This means 'total' will be at most 'limit'. This is a change from the previous step's logic for 'total'.
        # I will follow the prompt for *this specific subtask*.
        current_page_item_count = len(transformed_models)

        return {
            "items": transformed_models,
            "total": current_page_item_count,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        print(f"Error in get_hf_models (direct search): {str(e)}")
        # import traceback; traceback.print_exc();
        raise HTTPException(status_code=500, detail=f"Error processing Hugging Face models: {str(e)}")

async def download_hf_model(model_id: str) -> dict: # This function remains unchanged
    download_dir = settings.MODEL_DOWNLOAD_DIRECTORY
    try:
        os.makedirs(download_dir, exist_ok=True)
    except OSError as e:
        print(f"Error creating directory {download_dir}: {e}")
        raise HTTPException(status_code=500, detail=f"Could not create download directory: {str(e)}")

    simulated_file_path = os.path.join(download_dir, model_id.replace("/", "__"))
    print(f"Simulating download of model {model_id} to {simulated_file_path}")

    return {
        "message": f"Download simulation for model {model_id} has been logged on the server.",
        "model_id": model_id,
        "download_path": simulated_file_path
    }
