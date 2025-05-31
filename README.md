<<<<<<< HEAD
# Hugging Face Model Browser

A simple desktop application to browse and search for models on the Hugging Face Hub. You can also set a download directory and (simulate) downloading models.

## Features

- View the top models from Hugging Face Hub.
- Search for models by name/keyword.
- Set a custom directory for downloading models.
- Simulate downloading a selected model.

## Project Structure

- `app/main.py`: Main application entry point, contains the Tkinter UI.
- `app/utils.py`: Utilities for interacting with the Hugging Face API.
- `app/settings.py`: Handles loading and saving application settings (e.g., download directory).
- `tests/test_api.py`: Unit tests for API utility functions.
- `settings.json`: Stores application settings.
- `.gitignore`: Specifies intentionally untracked files that Git should ignore.
- `README.md`: This file.

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    The application uses `requests` for API calls and `tkinter` (usually part of Python standard library).
    Make sure you have `tkinter` installed. On Debian/Ubuntu, you might need to run:
    ```bash
    sudo apt-get update
    sudo apt-get install python3-tk
    ```
    Then install `requests`:
    ```bash
    pip install requests
    ```
    For running tests, you'll also need `requests-mock`:
    ```bash
    pip install requests-mock
    ```

## Running the Application

To start the application, run:
```bash
python -m app.main
```
Or directly:
```bash
python app/main.py
```

The application will create a `settings.json` file in the root directory to store your model download path if it doesn't exist.

## Running Tests

To run the unit tests:
```bash
python -m unittest discover tests
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.
=======
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

2.  **Set Up Environment Variables (Optional but Recommended for Backend):**
    The application backend can use environment variables (e.g., for a Hugging Face API Token). These are loaded from a `.env` file in the project root directory (the same directory as `docker-compose.yml`).

    *   **Create a `.env` file:** If it doesn't exist, you should create it, for example, by copying from the `.env.example` file located in the project root:
        ```bash
        # Example: copy if .env.example exists in the root
        cp .env.example .env
        ```
        Then, edit the `.env` file to add your actual token if you have one:
        ```env
        # .env
        HF_TOKEN="your_hugging_face_api_token_here"
        ```
    *   **Note on errors:** The `docker-compose.yml` is configured to use this `.env` file via the `env_file` directive. If this file is specified in `docker-compose.yml` and is missing, Docker Compose might issue a warning or error depending on the version and specific configuration (e.g., if it's listed as mandatory, though usually it's optional). An error like ".env: The system cannot find the file specified" means Docker Compose expected the file at the project root and didn't find it. Even if Docker Compose treats it as optional and proceeds, the application inside the container might later fail if it relies on an environment variable (like `HF_TOKEN`) that was supposed to be set by this file.

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
>>>>>>> main
