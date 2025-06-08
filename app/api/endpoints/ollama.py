from fastapi import APIRouter, HTTPException, Query
from app.services.ollama_service import test_ollama_connection, get_local_ollama_models, pull_model_ollama
from app.schemas.ollama_schemas import (
    OllamaConnectionRequest,
    OllamaConnectionResponse,
    OllamaLocalModelsResponse, # New
    OllamaPullRequest,         # New
    OllamaPullResponse         # New
)
from app.schemas.model_schemas import HFModel # For OllamaLocalModelInfo structure, though it's defined in ollama_schemas
from typing import List # For List[OllamaLocalModelInfo]

router = APIRouter()

@router.post(
    "/test-connection",
    response_model=OllamaConnectionResponse,
    summary="Test connection to Ollama API",
    description="Attempts to connect to a given Ollama API URL and retrieve model tags to verify connectivity and API compatibility."
)
async def test_ollama_api_connection(
    request_body: OllamaConnectionRequest
):
    """
    Tests the connection to an Ollama server using the provided URL.
    - **url**: The base URL of the Ollama API server (e.g., `http://localhost:11434`).
    """
    try:
        result = await test_ollama_connection(ollama_url=request_body.url)
        # The service layer now returns a dict with "status" and "message"
        # If status is "failure", we might want to use a non-200 HTTP status code,
        # but for a "test connection" endpoint, a 200 with success/failure in body is common.
        # Let's assume for now the service's detail is sufficient.
        # If the service raises an HTTPException, FastAPI handles it.
        # If it returns a dict, it will be wrapped in a 200 OK response.
        return OllamaConnectionResponse(status=result["status"], message=result["message"])
    except HTTPException as e:
        # Re-raise HTTPExceptions raised by the service layer if any
        raise e
    except Exception as e:
        # Catch any other unexpected errors from the service call
        print(f"Unexpected error in test_ollama_api_connection endpoint: {e}")
        # import traceback; traceback.print_exc();
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while testing Ollama connection: {str(e)}")


@router.get(
    "/local-models",
    response_model=OllamaLocalModelsResponse, # Uses the new schema
    summary="List locally available Ollama models",
    description="Fetches a list of models currently available in the specified local Ollama instance from its /api/tags endpoint."
)
async def list_local_ollama_models(
    ollama_url: str = Query(..., description="Base URL of the Ollama API server (e.g., http://localhost:11434).")
):
    """
    Retrieves a list of locally downloaded models from an Ollama instance.
    - **ollama_url**: The base URL of the Ollama API.
    """
    try:
        models_list = await get_local_ollama_models(ollama_url=ollama_url)
        # The service returns List[OllamaLocalModelInfo], which matches the schema's 'models' field.
        return OllamaLocalModelsResponse(models=models_list)
    except HTTPException as e:
        raise e # Re-raise if service layer raised it
    except Exception as e:
        print(f"Unexpected error in list_local_ollama_models endpoint: {e}")
        # import traceback; traceback.print_exc();
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while listing local Ollama models: {str(e)}")


@router.post(
    "/pull-model",
    response_model=OllamaPullResponse, # Uses the new schema
    summary="Pull a model into a local Ollama instance",
    description="Triggers a model pull operation on the specified Ollama instance. This can take a long time."
)
async def pull_ollama_model_endpoint(
    request_body: OllamaPullRequest # Contains ollama_url and model_name
):
    """
    Initiates pulling a model to the specified Ollama server.
    - **model_name**: Name of the model to pull (e.g., `mistral:latest`).
    - **ollama_url**: The base URL of the Ollama API where the model should be pulled.
    """
    try:
        result = await pull_model_ollama(ollama_url=request_body.ollama_url, model_name=request_body.model_name)
        # Service returns a dict like {"status": "...", "message": "..."}
        return OllamaPullResponse(status=result["status"], message=result["message"])
    except HTTPException as e:
        raise e # Re-raise if service layer raised it
    except Exception as e:
        print(f"Unexpected error in pull_ollama_model_endpoint: {e}")
        # import traceback; traceback.print_exc();
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while pulling the Ollama model: {str(e)}")
