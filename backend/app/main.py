from contextlib import asynccontextmanager
import sys
import argparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import FRONTEND_DIST
from app.db import create_db_and_tables
from app.routes.api import dashboard_router, router as api_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="MemoryForge", lifespan=lifespan)

# CORS - allow dev server and Tauri access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(dashboard_router)
app.include_router(api_router)

# Serve frontend static files (production mode)
# Must be registered AFTER api routes so /api/* takes priority
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


def main():
    """Entry point for both direct execution and PyInstaller bundle."""
    parser = argparse.ArgumentParser(description="MemoryForge Backend Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    args = parser.parse_args()

    import uvicorn
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


# PyInstaller sets __name__ == "__main__" for the entry script,
# but we also call main() directly for reliability in frozen mode.
if __name__ == "__main__":
    main()
