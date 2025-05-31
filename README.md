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

## Setup and Installation

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

## Running the Application

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
