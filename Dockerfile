# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the requirements file into the container first for better layer caching
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend application code into the container
COPY ./app ./app

# --- Add Frontend Assets ---
# Create the target directory for static frontend files
RUN mkdir -p /usr/src/app/static_frontend/icons

# Copy frontend files from the project root (where Dockerfile is) into the static directory
COPY index.html /usr/src/app/static_frontend/
COPY style.css /usr/src/app/static_frontend/
COPY script.js /usr/src/app/static_frontend/
COPY ./icons /usr/src/app/static_frontend/icons/
# --- End Add Frontend Assets ---

# Expose the port the app runs on (FastAPI will serve both API and frontend on this port)
EXPOSE 8000

# Define the command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
