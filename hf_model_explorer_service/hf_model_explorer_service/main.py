from fastapi import FastAPI
from .routers import hf_models
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO) # You can adjust the level and format as needed

app = FastAPI(
    title="Hugging Face Model Explorer API",
    description="An API to explore and search for models on the Hugging Face Hub.",
    version="0.1.0",
    # You can add more metadata like contact, license_info, etc.
)

# Include routers
app.include_router(hf_models.router)

@app.get("/", tags=["Root"])
async def read_root():
    """
    Root endpoint providing a welcome message.
    """
    return {"message": "Welcome to the Hugging Face Model Explorer API!"}

# Optional: Add startup/shutdown events if needed
# @app.on_event("startup")
# async def startup_event():
#     logging.info("Application startup...")
#     # Initialize resources, e.g., database connections if any

# @app.on_event("shutdown")
# async def shutdown_event():
#     logging.info("Application shutdown...")
#     # Clean up resources
