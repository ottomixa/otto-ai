import requests
import json
import os
from .settings import get_setting

HUGGINGFACE_API_BASE_URL = "https://huggingface.co/api/models"

def fetch_top_models():
    """
    Fetches the top 10 models from the Hugging Face API.
    Returns a list of model dictionaries, each containing 'modelId' and 'pipeline_tag'.
    Handles potential network or API errors.
    """
    try:
        response = requests.get(HUGGINGFACE_API_BASE_URL, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes
        models = response.json()

        top_models = []
        for model in models[:10]:
            model_info = {
                'modelId': model.get('modelId'),
                'pipeline_tag': model.get('pipeline_tag')
            }
            top_models.append(model_info)
        return top_models
    except requests.exceptions.JSONDecodeError: # Must be before RequestException
        print("Error decoding JSON response from API.")
        return []
    except requests.exceptions.RequestException as e: # This includes HTTPError and others
        print(f"Error fetching top models: {e}")
        return []
    except Exception as e: # General fallback
        print(f"An unexpected error occurred: {e}")
        return []

def search_models(query):
    """
    Searches for models on the Hugging Face API based on a query.
    Returns a list of model dictionaries, each containing 'modelId' and 'pipeline_tag'.
    Handles potential network or API errors.
    """
    try:
        response = requests.get(f"{HUGGINGFACE_API_BASE_URL}?search={query}", timeout=10)
        response.raise_for_status()
        models = response.json()

        search_results = []
        for model in models:
            model_info = {
                'modelId': model.get('modelId'),
                'pipeline_tag': model.get('pipeline_tag')
            }
            search_results.append(model_info)
        return search_results
    except requests.exceptions.JSONDecodeError: # Must be before RequestException
        print("Error decoding JSON response from API.")
        return []
    except requests.exceptions.RequestException as e: # This includes HTTPError and others
        print(f"Error searching models for query '{query}': {e}")
        return []
    except Exception as e: # General fallback
        print(f"An unexpected error occurred during search: {e}")
        return []

def download_model(model_id, download_directory=None):
    """
    Placeholder for model download functionality.
    Prints a message simulating the download.
    """
    if download_directory is None:
        download_directory = get_setting('model_directory')
        if download_directory is None: # Still None, means default setting was not found
            download_directory = "downloaded_models/" # Fallback if settings are also messed up

    # Ensure the directory exists
    if not os.path.exists(download_directory):
        try:
            os.makedirs(download_directory)
            print(f"Created directory: {download_directory}")
        except OSError as e:
            print(f"Error creating directory {download_directory}: {e}")
            return

    print(f"Simulating download of {model_id} to {download_directory}")

# Example usage (optional, can be removed or commented out)
if __name__ == '__main__':
    print("Fetching top models...")
    top_models = fetch_top_models()
    if top_models:
        for model in top_models:
            print(f"- {model['modelId']} ({model.get('pipeline_tag', 'N/A')})")

    print("\nSearching for 'text-generation' models...")
    searched_models = search_models("text-generation")
    if searched_models:
        for model in searched_models[:5]: # Print top 5 results for brevity
            print(f"- {model['modelId']} ({model.get('pipeline_tag', 'N/A')})")

    print("\nSimulating model download...")
    if top_models:
        download_model(top_models[0]['modelId'])
        download_model("user/specific-model-test", "custom_downloads/")
    else:
        download_model("gpt2", "default_downloads/")

    # Test with a setting
    # To make this part work, you'd need app.settings to be runnable directly or structure your project differently.
    # For now, we assume get_setting works as intended.
    # print(f"\nCurrent model directory from settings: {get_setting('model_directory')}")
    # update_setting('model_directory', 'new_models_path/')
    # print(f"Updated model directory from settings: {get_setting('model_directory')}")
    # download_model("another-model") # This would use 'new_models_path/'
    # # Revert for other tests if necessary
    # update_setting('model_directory', DEFAULT_SETTINGS['model_directory'])
    # print(f"Reverted model directory: {get_setting('model_directory')}")
