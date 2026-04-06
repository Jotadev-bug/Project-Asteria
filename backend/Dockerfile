FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code, models, and ml_pipeline
COPY backend/ ./backend/
COPY ml_pipeline/ ./ml_pipeline/

# Set env vars
ENV PYTHONPATH=/app
ENV PORT=8000

# Start FastAPI server
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
