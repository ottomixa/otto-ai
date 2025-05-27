# AI Conversational Interface with Custom Model & Backend Selection

This project is a web application designed to provide a flexible AI conversational experience. Users can select from various AI models and choose different backend services (simulating GPU providers) to run these models. The application features a pay-per-use conceptual billing system and aims to integrate with external model hubs like Hugging Face for model discovery.

## Project Structure Overview

```
.
├── app/                     # FastAPI backend application
│   ├── api/                 # API endpoint definitions
│   │   └── endpoints/
│   │       └── hf_models.py # Endpoints for Hugging Face models
│   ├── core/                # Core components like config
│   │   └── config.py
│   ├── services/            # Business logic, e.g., interacting with Hugging Face
│   │   └── huggingface_service.py
│   ├── schemas/             # Pydantic schemas for data validation
│   │   └── model_schemas.py
│   └── main.py              # FastAPI app instance and main router
├── icons/                   # Placeholder icons for UI
│   ├── default-model-icon.png
│   ├── default-provider-logo.png
│   ├── llama-icon.png
│   ├── mistral-icon.png
│   ├── codellama-icon.png
│   ├── replicate-logo.png
│   └── supercompute-logo.png
├── tests/                   # Backend tests (conceptual)
│   └── api/
│       └── endpoints/
│           └── test_hf_models.py
├── .env.example             # Example environment variables for backend
├── index.html               # Main frontend HTML file
├── script.js                # Frontend JavaScript logic
├── style.css                # Frontend CSS styles
└── README.md                # This file
└── requirements.txt         # Python dependencies for backend
```

## Prerequisites

*   **Python 3.8+:** For the backend service.
*   **pip:** Python package installer.
*   **Web Browser:** For accessing the frontend (e.g., Chrome, Firefox, Edge).
*   **(Optional) Hugging Face API Token:** If you want to make authenticated requests to the Hugging Face Hub (for higher rate limits or private models, though not strictly necessary for the current public model listing).

## Running the Application Locally

You'll need two terminal windows: one for the backend service and one for serving the frontend.

### 1. Backend Service (FastAPI)

   a. **Navigate to Project Root:**
      Open a terminal and navigate to the root directory of the project (`hf_integration_service/` or similar, where `app/` and `requirements.txt` are located).
      ```bash
      cd path/to/your_project_root
      ```

   b. **Create and Activate Virtual Environment (Recommended):**
      ```bash
      python -m venv .venv
      # On Windows:
      # .venv\Scripts\activate
      # On macOS/Linux:
      # source .venv/bin/activate
      ```

   c. **Install Dependencies:**
      ```bash
      pip install -r requirements.txt
      ```

   d. **Set Up Environment Variables (Optional):**
      If you have a Hugging Face API token, create a `.env` file in the project root (copy from `.env.example`):
      ```env
      # .env
      HF_TOKEN="your_hugging_face_api_token_here"
      ```

   e. **Run the Backend:**
      ```bash
      uvicorn app.main:app --reload --port 8000
      ```
      The backend should now be running on `http://127.0.0.1:8000`. You can check its interactive API documentation at `http://127.0.0.1:8000/docs`.

### 2. Frontend (HTML/CSS/JS)

   a. **Navigate to Project Root (if not already there):**
      Open a *new* terminal window and navigate to the same project root directory where `index.html` is located.

   b. **Serve the Frontend:**
      The simplest way is to use Python's built-in HTTP server.
      ```bash
      # For Python 3.x
      python -m http.server 8080 
      # Or choose another port if 8080 is busy, e.g., python -m http.server 8081
      ```
      If you have Node.js installed, you can also use `npx serve -l 8080`.
      Alternatively, if using VS Code, the "Live Server" extension is a good option.

   c. **Access the Application:**
      Open your web browser and go to `http://127.0.0.1:8080` (or the port you chose for the frontend server).

## Using the Application

*   The main chat interface will be displayed.
*   Click the "Configure Model & Provider" button to open the configuration panel.
*   **Model Loading:** The panel will attempt to fetch models from your locally running backend (`http://127.0.0.1:8000/api/v1/external-models/huggingface`).
    *   You should see a "Loading models..." message, then the list of models (initially top 10 downloaded from Hugging Face Hub via your backend).
    *   You can search for models.
*   **Provider Loading:** When you select a model, the provider section will show "Loading providers..." and then display *mock* provider data (as the backend endpoint for dynamic providers per model is not yet built).
*   **Applying Configuration:** After selecting a model and a (mock) provider, click "Apply Configuration". The panel will close, and the main chat header will display your selection.
*   **Chatting:** The chat functionality itself uses mocked AI responses directly in the frontend JavaScript.

This setup allows testing the frontend's ability to fetch and display model data from the backend, and the UI flow for configuration.

---

## Running with Docker (Single Container Setup)

This project can be run using Docker and Docker Compose, which simplifies setup by managing the combined backend and frontend service in a single container.

### Prerequisites for Docker

*   **Docker Desktop** installed and running (or Docker Engine and Docker Compose CLI on Linux).

### Steps to Run with Docker Compose

1.  **Navigate to Project Root:**
    Open a terminal and ensure you are in the root directory of the project (where `docker-compose.yml` and `Dockerfile` are located).

2.  **Set Up Environment Variables (Optional for Backend):**
    If you have a Hugging Face API token and want the backend to use it, ensure your `.env` file (in the project root) is configured as described in the "Backend Service (FastAPI)" section for non-Docker setup. Docker Compose will automatically pick up this file due to the `env_file: - .env` configuration in `docker-compose.yml`.

3.  **Build and Run the Application:**
    Execute the following command:
    ```bash
    docker-compose up --build
    ```
    *   `--build`: This flag tells Docker Compose to build the image (or rebuild it if changes were made to `Dockerfile` or application code/assets) before starting the container.
    *   This command will:
        *   Build the Docker image for the `app` service using `Dockerfile` (which now includes both backend and frontend assets).
        *   Start a container for the `app` service.
        *   Display logs from the service in your terminal.

4.  **Access the Application:**
    *   Open your web browser and go to `http://localhost:8080`.
    *   This single URL will serve the frontend UI. API calls from the frontend (e.g., to `/api/v1/...`) will also be directed to this same service on port 8080 (which maps to port 8000 in the container where FastAPI is listening).
    *   The backend's interactive API documentation will be available at `http://localhost:8080/docs`.

5.  **Development Notes:**
    *   The backend Python code (`./app` directory) is mounted as a volume into the container. If Uvicorn is run with `--reload` in the `Dockerfile`'s `CMD` (our current `CMD` is `["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`; for development, you might change this in the Dockerfile to include `--reload`), changes to backend code should trigger an automatic reload.
    *   Changes to frontend static files (`index.html`, `style.css`, `script.js`, `icons/`) will require rebuilding the Docker image (`docker-compose build app` or `docker-compose up --build`) because these files are copied into the image at build time and not mounted as volumes in this single-container setup.

6.  **Stopping the Application:**
    *   Press `CTRL+C` in the terminal where `docker-compose up` is running.
    *   To remove the container:
      ```bash
      docker-compose down
      ```

This Docker setup provides a consistent environment for running the combined frontend and backend service.
