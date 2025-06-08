import httpx
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
