# 1. Use an official Python base image
FROM python:3.9-slim

# 2. Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory in the container
WORKDIR /app

# 4. Copy requirements.txt and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip &&     pip install --no-cache-dir -r requirements.txt

# 5. Copy backend application code into the container
COPY ./app /app/app

# 6. Copy frontend static files into a directory to be served
# All frontend assets (index.html, script.js, style.css, icons/, favicon.ico)
# are now expected to be in the ./static_frontend/ directory in the build context.
COPY ./static_frontend /app/static_frontend/

# 7. Expose the port the app runs on
EXPOSE 8000

# 8. Define the command to run the application
#    --host 0.0.0.0 makes it accessible from outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
