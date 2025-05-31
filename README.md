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
