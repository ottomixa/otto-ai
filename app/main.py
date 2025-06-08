from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import hf_models as hf_models_router
from app.api.endpoints import ollama as ollama_router # Added Ollama router import
from app.core.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Hugging Face Model Browser API",
    version="0.1.0",
    description="API for browsing, searching, and (simulating) downloading Hugging Face models."
)

# CORS (Cross-Origin Resource Sharing) Middleware
# This is important if your frontend is served from a different domain/port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins. For production, specify allowed origins.
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # Allows all standard methods.
    allow_headers=["*"], # Allows all headers.
)

# Include the Hugging Face models router
# The prefix /api/v1/hf-models matches the frontend's expected base URL
app.include_router(
    hf_models_router.router,
    prefix="/api/v1/hf-models",
    tags=["Hugging Face Models"]
)

# Include the Ollama router
app.include_router(
    ollama_router.router,
    prefix="/api/v1/ollama", # Standardized API prefix
    tags=["Ollama Management"]
)

# Serve static frontend files (HTML, CSS, JS, Icons)
# This must come AFTER API router inclusions to ensure API paths are prioritized.
# The `html=True` argument makes it serve `index.html` for the root path ("/").
# The `directory` path is absolute within the Docker container, based on WORKDIR and COPY instructions.
app.mount("/", StaticFiles(directory="/app/static_frontend", html=True), name="static_root")


if __name__ == "__main__":
    import uvicorn
    # This is for running the FastAPI app directly using Uvicorn for development
    # Production deployments would typically use Gunicorn + Uvicorn workers or similar.
    # The host "0.0.0.0" makes it accessible on the network.
    # reload=True enables auto-reloading on code changes.
    print(f"Starting Uvicorn server. API will be at http://localhost:8000")
    print(f"Default model download directory from settings: {settings.MODEL_DOWNLOAD_DIRECTORY}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

# Note: The previous Tkinter application code has been removed from this file
# as it's being replaced by a FastAPI backend service.
# The frontend (script.js, index.html, style.css) will interact with this API.
