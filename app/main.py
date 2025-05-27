from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Assuming your API routers are imported like this
from .api.endpoints import hf_models 
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Model Hub Integration Service with Frontend")

origins = [
    "http://localhost",
    "http://localhost:8080", 
    "http://localhost:8000", 
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hf_models.router, prefix="/api/v1/external-models/huggingface", tags=["Hugging Face Models"])

STATIC_FILES_ROOT_IN_CONTAINER = "/usr/src/app/static_frontend"

# For local development without Docker, this helps create the dir if running main.py directly
# and static_frontend is expected to be a sibling of the 'app' directory.
if not os.path.exists(STATIC_FILES_ROOT_IN_CONTAINER) and "DOCKER_ENV" not in os.environ:
    # This path logic is for local dev: assumes 'app' is a dir and 'static_frontend' is at project root.
    # So, if main.py is in 'app/main.py', 'static_frontend' is '../static_frontend'.
    # This specific local dev path might need adjustment based on actual execution context.
    # However, for Docker, the absolute path STATIC_FILES_ROOT_IN_CONTAINER is what matters.
    local_dev_static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static_frontend")
    if os.path.exists(local_dev_static_path):
        # In local dev, if we find static_frontend next to app dir, we use that for StaticFiles paths
        # This is a bit of a hack for local dev; Docker is cleaner.
        # For now, we'll assume Dockerfile handles placing files into STATIC_FILES_ROOT_IN_CONTAINER
        pass # The Dockerfile will ensure files are at STATIC_FILES_ROOT_IN_CONTAINER
    # os.makedirs(STATIC_FILES_ROOT_IN_CONTAINER, exist_ok=True) # Not ideal to create this path in local dev


app.mount("/icons", StaticFiles(directory=f"{STATIC_FILES_ROOT_IN_CONTAINER}/icons"), name="icons")

@app.get("/script.js")
async def serve_script():
    return FileResponse(f"{STATIC_FILES_ROOT_IN_CONTAINER}/script.js", media_type="application/javascript")

@app.get("/style.css")
async def serve_style():
    return FileResponse(f"{STATIC_FILES_ROOT_IN_CONTAINER}/style.css", media_type="text/css")

@app.get("/") # Explicitly serve index.html for root
async def serve_root_explicitly(): 
    return FileResponse(f"{STATIC_FILES_ROOT_IN_CONTAINER}/index.html", media_type="text/html")

@app.get("/{full_path:path}")
async def serve_frontend_index_catch_all(request: Request, full_path: str):
    # Check if the path is likely an API call or a known static asset prefix
    if full_path.startswith("api/") or \
       full_path.startswith("docs") or \
       full_path.startswith("redoc") or \
       full_path == "openapi.json":
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"detail": "Resource not found"})
    
    # For any other path, serve index.html (typical SPA behavior / frontend routing)
    return FileResponse(f"{STATIC_FILES_ROOT_IN_CONTAINER}/index.html", media_type="text/html")
