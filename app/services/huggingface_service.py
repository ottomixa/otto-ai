# Full content for app/services/huggingface_service.py
import os
from fastapi import HTTPException
from app.core.config import settings
from huggingface_hub import list_models
from huggingface_hub.hf_api import ModelInfo, ModelFilter # ModelFilter moved here
import datetime

async def get_hf_models(search: str = None, limit: int = 10, page: int = 1, sort_by: str = 'downloads', direction: str = 'desc') -> dict:
    try:
        sort_field = sort_by if sort_by in ['downloads', 'likes', 'lastModified'] else 'lastModified'
        sort_direction = -1 if direction == 'desc' else 1

        # Calculate the number of items to skip based on the page number and limit.
        # list_models does not have a direct 'skip' or 'offset' parameter.
        # We need to fetch enough items to cover up to the current page and then slice.
        # Fetch up to `page * limit` items.
        # However, to get the *actual* items for the current page, we fetch more initially
        # and then slice. If we fetch `page * limit`, the last item is the end of our page.
        # To ensure we have enough items for the *next* potential page if we were calculating 'total_available',
        # we might fetch `(page + 1) * limit` or similar.
        # For this implementation, let's fetch up to a certain number of models and then slice.
        # The `limit` in `list_models` is the total number of models to retrieve.
        # A practical limit for a single API call, let's cap it to avoid overly large requests.
        # Max items to fetch from API in one go. HF API might have its own upper limit.
        # If page=1, limit=10, fetch 10. start=0, end=10
        # If page=2, limit=10, fetch 20. start=10, end=20
        # If page=3, limit=10, fetch 30. start=20, end=30

        # Determine how many total items to fetch from the API based on the current page and limit
        # This is to ensure we have enough items to display the current page.
        # list_models `limit` parameter is the total number of items to return from the API.
        api_fetch_limit = page * limit
        # Cap the fetch limit to avoid excessive requests, e.g., max 200 models for deep pages.
        # This isn't a perfect solution for very deep pagination but a practical constraint.
        api_fetch_limit = min(api_fetch_limit, 200)


        model_infos_iterator = list_models(
            filter=ModelFilter(search=search) if search and search.strip() else None,
            sort=sort_field,
            direction=sort_direction,
            limit=api_fetch_limit, # Fetch enough models to cover up to the current page
            full=True,
            cardData=False # Don't fetch full markdown card data, only structured metadata
        )

        # Convert iterator to list to allow slicing
        all_models_fetched_from_api = list(model_infos_iterator)

        # Slice the list to get only the models for the current page
        start_index = (page - 1) * limit
        end_index = start_index + limit
        models_for_current_page = all_models_fetched_from_api[start_index:end_index]

        transformed_models = []
        for model_info in models_for_current_page:
            if isinstance(model_info, ModelInfo):
                tags_list = model_info.tags if model_info.tags else []
                # Ensure all tags are strings, as sometimes non-string items can appear
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
                    "description": model_info.pipeline_tag, # Using pipeline_tag as a placeholder for a short description
                    "iconUrl": None # No standard icon URL from this API endpoint
                })

        # The 'total' here reflects the number of items *available in the fetched batch up to api_fetch_limit*,
        # not the grand total available on Hugging Face for that query.
        # A true total count isn't directly provided by list_models for efficient pagination.
        # For this example, we'll return the count of all models fetched that could satisfy up to the current page depth.
        # This is still not a "total pages" or "total available" count.
        # If we need a more accurate total, it often requires other API capabilities or estimations.
        # For now, total will represent the number of items in the current page's results, which is typical for some APIs.
        # However, the frontend uses 'total' to calculate total pages, so len(all_models_fetched_from_api)
        # or a capped value might be more appropriate if the API doesn't provide a true total.
        # Let's use the length of the *potentially available* items up to the api_fetch_limit.
        # A more accurate total would be the len(all_models_fetched_from_api) before slicing for the current page.
        # But the frontend expects 'total' to be the grand total. This is a limitation.
        # For now, let's send the count of items returned for *this page* as 'total_in_batch'
        # and the frontend will have to adapt or we accept current pagination limits.
        # The prompt for schema has "total: int (Reflecting the count of items in the current response, as per service)"
        # This was later changed in frontend to expect a real total.
        # The new service returns a limited set. Let's make 'total' the total number of items *fetched from API before slicing for page*.
        # This gives a better idea of "total found up to this point".
        # A true grand total is not available from `list_models` directly.

        return {
            "items": transformed_models,
            "total": len(all_models_fetched_from_api), # Total items fetched that match criteria up to api_fetch_limit
            "page": page,
            "limit": limit
        }
    except Exception as e:
        print(f"Error in get_hf_models (using huggingface_hub): {str(e)}")
        # import traceback; traceback.print_exc(); # For detailed server logs during development
        raise HTTPException(status_code=500, detail=f"Error processing Hugging Face models: {str(e)}")

async def download_hf_model(model_id: str) -> dict:
    download_dir = settings.MODEL_DOWNLOAD_DIRECTORY
    try:
        os.makedirs(download_dir, exist_ok=True)
    except OSError as e:
        # Handle potential errors during directory creation, e.g., permission issues
        print(f"Error creating directory {download_dir}: {e}") # Or use proper logging
        raise HTTPException(status_code=500, detail=f"Could not create download directory: {str(e)}")

    # Simulate file path; in a real scenario, snapshot_download returns the path.
    # Replace slashes with underscores for a single directory per model (common practice)
    simulated_file_path = os.path.join(download_dir, model_id.replace("/", "__"))
    print(f"Simulating download of model {model_id} to {simulated_file_path} directory.")
    # In a real scenario, you might create a placeholder file or directory here.
    # For example, os.makedirs(simulated_file_path, exist_ok=True)

    return {
        "message": f"Download simulation for model {model_id} has been logged on the server. Target directory: {simulated_file_path}",
        "model_id": model_id,
        "download_path": simulated_file_path # This is a simulated path to a directory for the model
    }
