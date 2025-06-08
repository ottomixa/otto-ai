import httpx
import os
from fastapi import HTTPException # Added
from app.core.config import settings # Added
from typing import List, Optional # Added
from app.schemas.ollama_schemas import OllamaLocalModelInfo # Added

# asyncio might not be needed if httpx handles its own timeouts well.

async def test_ollama_connection(ollama_url: str) -> dict:
    """
    Tests connectivity to an Ollama API server.
    It tries to connect and get a response from Ollama's /api/tags endpoint.
    """
    processed_url = ollama_url.strip()
    if not processed_url.startswith("http://") and not processed_url.startswith("https://"):
        processed_url = f"http://{processed_url}" # Default to http

    # Ensure no trailing slash for base, then correctly append /api/tags
    api_test_url = f"{processed_url.rstrip('/')}/api/tags"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(api_test_url)

        if response.status_code == 200:
            # Further check if it's really Ollama by looking for expected JSON structure
            try:
                data = response.json()
                if isinstance(data, dict) and "models" in data and isinstance(data["models"], list):
                    return {"status": "success", "message": f"Successfully connected to Ollama at {ollama_url} and received valid /api/tags response."}
                else:
                    return {"status": "failure", "message": f"Connected to {ollama_url}, got status 200 from {api_test_url}, but response format was not as expected from Ollama /api/tags."}
            except Exception:
                 return {"status": "failure", "message": f"Connected to {ollama_url}, got status 200 from {api_test_url}, but could not parse JSON response or format unexpected."}
        else:
            error_detail = response.text[:200] if response.text else "No response body"
            return {"status": "failure", "message": f"Connected to {ollama_url}, but received status {response.status_code} from {api_test_url}. Response: {error_detail}"}

    except httpx.TimeoutException:
        return {"status": "failure", "message": f"Connection to {api_test_url} timed out (5 seconds)."}
    except httpx.ConnectError:
        return {"status": "failure", "message": f"Failed to connect to Ollama at {ollama_url} (attempted {api_test_url}). Check server, port, and if Ollama is running."}
    except httpx.RequestError as e:
        return {"status": "failure", "message": f"HTTP request error while contacting {api_test_url}: {str(e)}"}
    except Exception as e:
        print(f"Unexpected error testing Ollama connection to {ollama_url} ({api_test_url}): {e}")
        # import traceback; traceback.print_exc() # For server-side debugging
        return {"status": "failure", "message": f"An unexpected error occurred: {str(e)}"}


async def get_local_ollama_models(ollama_url: str) -> List[OllamaLocalModelInfo]:
    processed_url = ollama_url.strip()
    if not processed_url.startswith("http://") and not processed_url.startswith("https://"):
        processed_url = f"http://{processed_url}"

    api_tags_url = f"{processed_url.rstrip('/')}/api/tags"
    local_models = []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client: # Increased timeout for potentially larger list
            response = await client.get(api_tags_url)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

        data = response.json()
        if "models" in data and isinstance(data["models"], list):
            for model_data in data["models"]:
                local_models.append(
                    OllamaLocalModelInfo(
                        name=model_data.get("name"),
                        modified_at=model_data.get("modified_at"),
                        size=model_data.get("size"),
                        digest=model_data.get("digest")
                    )
                )
        return local_models
    except httpx.HTTPStatusError as e:
        # Log the error and response content for debugging
        print(f"HTTP error fetching local Ollama models from {api_tags_url}: {e.response.status_code} - {e.response.text[:200] if e.response.text else 'No response text'}")
        # Depending on desired behavior, could return empty list or raise an HTTPException
        # For now, return empty list on error, frontend can indicate "failed to fetch"
        return []
    except httpx.RequestError as e:
        print(f"Request error fetching local Ollama models from {api_tags_url}: {str(e)}")
        return []
    except Exception as e:
        print(f"Unexpected error fetching local Ollama models from {api_tags_url}: {str(e)}")
        # import traceback; traceback.print_exc();
        return []

async def pull_model_ollama(ollama_url: str, model_name: str) -> dict:
    processed_url = ollama_url.strip()
    if not processed_url.startswith("http://") and not processed_url.startswith("https://"):
        processed_url = f"http://{processed_url}"

    api_pull_url = f"{processed_url.rstrip('/')}/api/pull"
    payload = {"name": model_name, "stream": False} # stream: False for a consolidated response

    try:
        # Pulling can take a very long time, default httpx timeout might be too short.
        # Using a longer timeout for pull operation.
        async with httpx.AsyncClient(timeout=300.0) as client: # 5 minutes timeout
            response = await client.post(api_pull_url, json=payload)

        # Ollama's /api/pull with stream:false gives 200 OK even if model is already present or if pull fails early.
        # The response body indicates the actual status.
        # Example success: {"status":"success"}
        # Example already exists: {"status":"success","message":"model 'mistral:latest' already exists"}
        # Example error: {"error":"pull model manifest not found"} (this comes with 404 usually)

        if response.status_code == 404: # Model not found on the hub by Ollama
             return {"status": "failure", "message": f"Model '{model_name}' not found by Ollama (or on the remote hub). Error: {response.json().get('error', 'Not found')}"}

        response.raise_for_status() # Check for other HTTP errors (like 500 from Ollama)

        # If successful (200 OK), check the content of the response
        response_data = response.json()
        if "status" in response_data and "success" in response_data["status"].lower():
             # Check for specific messages like "already exists"
            if "message" in response_data and "already exists" in response_data["message"].lower():
                return {"status": "success_already_exists", "message": response_data.get("message", f"Model '{model_name}' already exists locally.")}
            return {"status": "success", "message": response_data.get("message", f"Model '{model_name}' pulled successfully (or was already up to date).")}
        else:
            # Some other 200 OK response that isn't a clear success for pull
            return {"status": "failure", "message": f"Pull command for '{model_name}' sent, but Ollama responded with an unclear status: {response_data}"}

    except httpx.HTTPStatusError as e:
        error_message = f"Ollama API returned an error: {e.response.status_code}."
        try:
            error_detail = e.response.json().get("error", e.response.text[:100])
            error_message += f" Detail: {error_detail}"
        except Exception: # If response is not JSON or .text is problematic
            error_message += " Could not parse error response."
        return {"status": "failure", "message": error_message}
    except httpx.TimeoutException:
        return {"status": "failure", "message": f"Pulling model '{model_name}' from {ollama_url} timed out (5 minutes). The model might still be downloading in Ollama."}
    except httpx.RequestError as e:
        return {"status": "failure", "message": f"Request error while trying to pull model '{model_name}': {str(e)}"}
    except Exception as e:
        print(f"Unexpected error pulling model '{model_name}' from {ollama_url}: {str(e)}")
        # import traceback; traceback.print_exc();
        return {"status": "failure", "message": f"An unexpected error occurred: {str(e)}"}
