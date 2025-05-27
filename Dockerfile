# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the backend's requirements file into the container
# Adjusted path based on identified structure
COPY ./hf_model_explorer_service/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend application code into a directory named 'app' inside the container
# Source is ./hf_model_explorer_service/hf_model_explorer_service
# Destination is ./app (relative to WORKDIR /usr/src/app)
COPY ./hf_model_explorer_service/hf_model_explorer_service ./app

# --- Add Frontend Assets (These paths remain correct if files are in project root) ---
# Create the target directory for static frontend files
RUN mkdir -p /usr/src/app/static_frontend/icons

# Copy frontend files from the project root (where Dockerfile is) into the static directory
COPY index.html /usr/src/app/static_frontend/
COPY style.css /usr/src/app/static_frontend/
COPY script.js /usr/src/app/static_frontend/
COPY ./icons /usr/src/app/static_frontend/icons/
# --- End Add Frontend Assets ---

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application
# This CMD expects the FastAPI 'app' instance to be in 'app/main.py'
# which aligns with where we copied hf_model_explorer_service/hf_model_explorer_service
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
