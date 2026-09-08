"""
RakshaSethu Backend Server Runner
Ensures the backend environment is configured and launches the FastAPI API server on port 8000.
"""
import os
import sys
from pathlib import Path

# Add backend directory to Python sys.path
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn
from app.core.config import settings
from main import app

if __name__ == "__main__":
    print(f"Starting {settings.APP_NAME} Backend on http://{settings.APP_HOST}:{settings.APP_PORT} (Docs: http://{settings.APP_HOST}:{settings.APP_PORT}/docs)...")
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        log_level="info",
        reload=True,
        reload_dirs=[str(backend_dir)],
    )

