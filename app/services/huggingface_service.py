import requests
import os
import json
from fastapi import HTTPException
from app.core.config import settings # Corrected: directly import settings instance

HF_API_URL = "https://huggingface.co/api/models"

async def get_hf_models(search: str = None, limit: int = 10, page: int = 1, sort_by: str = 'downloads', direction: str = 'desc') -> dict:
    params = {'full': 'true'} # Request full details

    # For Hugging Face API, 'limit' is straightforward.
    # 'page' is not directly supported via a page number.
    # To implement pagination, one typically fetches limit * page items and then slices,
    # or uses cursor-based pagination if the API supports it (e.g. via Link headers or 'next' fields).
    # Hugging Face API's /api/models doesn't offer cursor or direct page number for deep pagination easily.
    # It does have 'limit' and 'skip' (undocumented but observable in some contexts).
    # For simplicity here, we'll use limit and acknowledge 'page' is not truly implemented for deep pages.
    # If page > 1, it would ideally involve fetching more and slicing, or using a 'skip' if available.
    # For this exercise, we will fetch `limit` items. If `page` > 1, it won't get the "next page" in the truest sense without more complex logic.

    params['limit'] = limit

    if search:
        params['search'] = search

    if sort_by:
        sort_param = sort_by
        if direction == 'desc':
            sort_param = f"-{sort_by}"
        params['sort'] = sort_param

    try:
        response = requests.get(HF_API_URL, params=params, timeout=10) # Added timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
    except requests.exceptions.RequestException as e:
        # This catches network errors, timeout errors, too many redirects, etc.
        raise HTTPException(status_code=503, detail=f"Error connecting to Hugging Face API: {str(e)}")

    # response.raise_for_status() already handled non-2xx responses.
    # If we are here, response.status_code is 2xx.

    try:
        models_data = response.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error decoding JSON response from Hugging Face API")

    transformed_models = []
    for model in models_data:
        if not isinstance(model, dict): # Basic check if the model data is not as expected
            continue
        transformed_models.append({
            "id": model.get('modelId'),
            "name": model.get('modelId'), # HF API primarily uses modelId; 'name' isn't a common top-level field for general models
            "iconUrl": None,  # No standard icon URL from this API endpoint
            "creator": model.get('author'),
            "description": model.get('pipeline_tag', 'No pipeline tag provided.'), # Using pipeline_tag as a placeholder description
            "tags": model.get('tags', []),
            "lastModified": model.get('lastModified'),
            "downloads": model.get('downloads', 0),
            "likes": model.get('likes', 0),
            "private": model.get('private', False),
        })

    # 'total' ideally comes from API (e.g. 'x-total-count' header or a total in response body)
    # Hugging Face API for /api/models doesn't provide a direct total count for a search query in headers or body easily.
    # For now, total will be the number of items fetched in this batch, which isn't true total available.
    # A more accurate total would require a separate call or different API endpoint if one exists.
    total_items_in_batch = len(transformed_models)

    return {"items": transformed_models, "total": total_items_in_batch, "page": page, "limit": limit}


async def download_hf_model(model_id: str) -> dict:
    download_dir = settings.MODEL_DOWNLOAD_DIRECTORY

    try:
        os.makedirs(download_dir, exist_ok=True)
    except OSError as e:
        # Handle potential errors during directory creation, e.g., permission issues
        # Log the error server-side
        print(f"Error creating directory {download_dir}: {e}") # Or use proper logging
        raise HTTPException(status_code=500, detail=f"Could not create download directory: {str(e)}")

    # Simulate download
    # In a real scenario, this would involve `huggingface_hub.snapshot_download` or similar
    print(f"Simulating download of model {model_id} to {download_dir}")

    # Placeholder for actual download path if files were downloaded
    # For simulation, we can just point to the directory
    simulated_path = os.path.join(download_dir, model_id.replace('/', '_')) # Basic way to create a subfolder/file name

    return {
        "message": f"Download simulation started for {model_id}. Check server logs.",
        "model_id": model_id,
        "download_path": simulated_path # This is a simulated path
    }

# Example of how settings would be used if this file was run directly (not typical for services)
if __name__ == '__main__':
    # This part is for illustration if you were to test this file directly
    # In a FastAPI app, settings are typically loaded when the app starts
    print(f"Default model download directory: {settings.MODEL_DOWNLOAD_DIRECTORY}")

    # Example usage of the async functions (requires an event loop runner like asyncio.run)
    import asyncio

    async def main():
        print("\n--- Testing get_hf_models ---")
        try:
            # Test fetching top models
            top_models_data = await get_hf_models(limit=3)
            print(f"Fetched {len(top_models_data['items'])} top models (limit 3):")
            for m in top_models_data['items']:
                print(f"  - {m['id']} (Downloads: {m['downloads']}, Creator: {m['creator']})")
            print(f"Total in batch: {top_models_data['total']}")

            print("\n--- Testing search ---")
            # Test searching for models
            searched_models_data = await get_hf_models(search="bert", limit=2, sort_by="likes")
            print(f"Found {len(searched_models_data['items'])} models for 'bert' (limit 2, sort by likes):")
            for m in searched_models_data['items']:
                print(f"  - {m['id']} (Likes: {m['likes']}, Creator: {m['creator']})")
            print(f"Total in batch: {searched_models_data['total']}")

        except HTTPException as e:
            print(f"HTTP Exception: {e.status_code} - {e.detail}")
        except Exception as e:
            print(f"Generic error in example: {e}")

        print("\n--- Testing download_hf_model ---")
        try:
            download_info = await download_hf_model("gpt2")
            print(f"Download info: {download_info}")

            # Test with a namespaced model
            download_info_custom = await download_hf_model("google/flan-t5-small")
            print(f"Download info for namespaced model: {download_info_custom}")

        except HTTPException as e:
            print(f"HTTP Exception during download: {e.status_code} - {e.detail}")
        except Exception as e:
            print(f"Generic error in download example: {e}")

    if os.name == 'nt': # Windows patch for asyncio if needed for direct run
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    # asyncio.run(main()) # Commented out to prevent execution during tool call validation
    # To run this example: uncomment asyncio.run(main()) and run `python app/services/huggingface_service.py`
    # Make sure your terminal is in the project root directory.
    print("Service file created. Example usage commented out.")
