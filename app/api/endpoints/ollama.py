from fastapi import APIRouter, HTTPException
from app.services.ollama_service import test_ollama_connection
from app.schemas.ollama_schemas import OllamaConnectionRequest, OllamaConnectionResponse

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
