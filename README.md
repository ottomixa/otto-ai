# AI Chat Interface with Hugging Face Model Browser

This project provides a web-based AI chat interface with a backend powered by FastAPI. It includes functionality to browse, search, and simulate downloading models from the Hugging Face Hub.

## Features

-   **Chat Interface:** A responsive UI for interacting with an AI (currently mock responses).
-   **Hugging Face Model Browser:**
    -   View and search for models from the Hugging Face Hub via backend API.
    -   Conditionally display a "Download" button for models when "Local Llama" engine is selected.
    -   Simulate model downloads to a server-configured directory.
-   **Engine Selection:** Choose between different "engines" (e.g., Local Llama, Cloud Providers) to contextually change UI and model sources.
-   **FastAPI Backend:** Serves model information and handles download requests.

## Project Structure

-   `app/`: Contains the FastAPI backend application.
    -   `api/endpoints/hf_models.py`: API endpoints for Hugging Face model operations.
    -   `services/huggingface_service.py`: Business logic for interacting with Hugging Face API.
    -   `schemas/model_schemas.py`: Pydantic schemas for data validation.
    -   `core/config.py`: Backend configuration (e.g., model download directory).
    -   `main.py`: FastAPI app instance and main router.
-   `icons/`: Placeholder icons for the UI.
-   `tests/`: Placeholder for backend tests.
-   `index.html`: The main frontend HTML file.
-   `script.js`: Frontend JavaScript logic for UI interactions and API calls.
-   `style.css`: Frontend CSS styles.
-   `requirements.txt`: Python dependencies for the backend.
-   `README.md`: This file.
-   `.env.example`: Example for environment variables (though not strictly enforced by current `config.py` setup without explicit `.env` loading).
-   `downloaded_models/`: Default directory where models are "downloaded" (this directory is in `.gitignore`).

## Running with Docker (Recommended)

This application can be easily built and run using Docker Compose. This method uses the `Dockerfile` to build the image and the `docker-compose.yml` to configure and run the service.

**Prerequisites:**
- Docker Desktop (which includes Docker Compose) or Docker Engine with the Docker Compose plugin installed and running.

**1. Build and Run with Docker Compose:**
Navigate to the project root directory (where `docker-compose.yml` and `Dockerfile` are located) and run:
```bash
docker-compose up --build -d
```
-   `--build`: Forces Docker Compose to build the image before starting the services (recommended for the first run or after code changes).
-   `-d`: Runs the containers in detached mode (in the background).

This command will:
- Build the Docker image for the `app` service as defined in `Dockerfile`.
- Start the `app` service (named `hf_chat_app_container` internally).
- Create and use the named volume `downloaded_models_volume` for model storage at `/app/downloaded_models` inside the container.

**2. Access the Application:**
Once the service is running, open your web browser and navigate to:
[http://localhost:8000](http://localhost:8000)

The chat interface and backend API (e.g., `http://localhost:8000/api/v1/...`) will be available.

**3. View Logs:**
To view the logs from the running `app` service:
```bash
docker-compose logs -f app
```

**4. Stop the Application:**
To stop the application (and remove containers, default network):
```bash
docker-compose down
```
If you want to stop the services but keep the `downloaded_models_volume` (so your downloaded models persist for the next `docker-compose up`):
```bash
docker-compose stop
```
To remove the named volume explicitly (e.g., for a full cleanup), you can run `docker-compose down -v` or manage Docker volumes separately (`docker volume ls`, `docker volume rm downloaded_models_volume`).

**Model Download Directory with Docker Compose:**
The `docker-compose.yml` file defines a named volume (`downloaded_models_volume`) that is mounted to `/app/downloaded_models` inside the container. This is where models will be "downloaded" (currently simulated). This data will persist across container restarts if you use `docker-compose stop` and `docker-compose up`. It is removed if you use `docker-compose down -v`.

If you prefer to use a local directory on your host machine (bind mount) instead of a Docker-managed named volume, you can modify the `volumes` section in `docker-compose.yml` for the `app` service. For example:
```yaml
services:
  app:
    # ... other settings ...
    volumes:
      - ./my_local_hf_models:/app/downloaded_models
```
Ensure the local directory (`./my_local_hf_models` in this example) exists on your host machine.

## Manual Setup and Installation

_(Alternatively, for non-Docker setup, follow these instructions.)_

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Set up Python Backend:**
    -   Create and activate a virtual environment:
        ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows: venv\Scripts\activate
        ```
    -   Install Python dependencies:
        ```bash
        pip install -r requirements.txt
        ```
            This will install all necessary dependencies, including `fastapi`, `uvicorn`, `requests`, `pydantic-settings`, and `huggingface-hub`.

3.  **(Optional) Environment Variables:**
    Create a `.env` file in the project root if you want to override default settings (e.g., `MODEL_DOWNLOAD_DIRECTORY`). `pydantic-settings` will automatically load it.
    Example content for `.env`:
    ```
    MODEL_DOWNLOAD_DIRECTORY=./my_custom_models_dir/
    ```

## Running the Application (Manual Setup)

1.  **Start the FastAPI Backend:**
    From the project root directory, run:
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend will typically be available at `http://127.0.0.1:8000`.

2.  **Open the Frontend:**
    Open the `index.html` file directly in your web browser.

You should now be able to interact with the chat interface and use the settings panel to browse Hugging Face models.

## API Endpoints

The backend exposes the following main endpoints related to Hugging Face models under the `/api/v1/hf-models` prefix:

-   `GET /`: Lists and searches for models.
    -   Query Parameters: `search`, `limit`, `page`, `sort_by`, `direction`.
    -   Note: The `total` field in the JSON response for this endpoint indicates the number of model items fetched from the Hugging Face Hub that match the query, up to a service-defined maximum for a single query (used for pagination calculations by the frontend), not necessarily the absolute grand total available in the Hub.
-   `POST /{model_id}/download`: Simulates downloading a specific model.

## Development Notes

-   **CORS:** The FastAPI backend is configured with permissive CORS settings for development. These should be reviewed and restricted for a production environment.
-   **Model Downloads:** The download functionality is currently a simulation (logs to server console and creates directory). Actual model downloading using `huggingface_hub` or similar would require further implementation in `app/services/huggingface_service.py`.
-   **Model Information Source:** Model information (listing, searching) is fetched from the Hugging Face Hub using the `huggingface_hub` Python library.
