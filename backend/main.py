import asyncio
import logging
import logging.config
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import (
    validate_config,
    CORS_ORIGINS,
    IS_PRODUCTION,
    LOG_LEVEL,
)

from database import create_tables, engine
from routes import router as memory_router
from services.generator import run_orphaned_photo_sweep_loop
from sqlmodel import Session

# Configure structured logging
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "detailed" if not IS_PRODUCTION else "default",
            "stream": "ext://sys.stdout",
        },
    },
    "root": {
        "level": LOG_LEVEL,
        "handlers": ["console"],
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)


async def health_check_db() -> dict:
    """Check database connectivity."""
    try:
        with Session(engine) as session:
            result = session.execute("SELECT 1")
            return {"status": "ok", "database": "connected"}
    except Exception as exc:
        logger.error(f"Database health check failed: {exc}")
        return {"status": "error", "database": "disconnected"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""

    logger.info("=" * 80)
    logger.info("🚀 Starting MemoraAI API Server")
    logger.info("=" * 80)

    # Validate configuration
    try:
        validate_config()
        logger.info("✓ Configuration validation passed")
    except Exception as exc:
        logger.critical(f"Configuration validation failed: {exc}")
        raise

    # Initialize database
    try:
        logger.info("Initializing database...")
        create_tables()
        logger.info("✓ Database initialized")
    except Exception as exc:
        logger.critical(f"Failed to initialize database: {exc}")
        raise

    sweep_task = asyncio.create_task(run_orphaned_photo_sweep_loop())

    logger.info("=" * 80)
    logger.info("✓ MemoraAI API Ready")
    logger.info("=" * 80)

    yield

    logger.info("Shutting down MemoraAI services...")
    sweep_task.cancel()
    try:
        await sweep_task
    except asyncio.CancelledError:
        pass
    logger.info("Goodbye!")


app = FastAPI(
    title="MemoraAI API",
    description=(
        "AI-powered visual storytelling platform "
        "for generating cinematic memory cards and digital keepsakes."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not IS_PRODUCTION else None,
    redoc_url="/redoc" if not IS_PRODUCTION else None,
)


# Middleware: Request size limit
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    """Enforce maximum request size."""
    from config import MAX_REQUEST_SIZE

    if request.method not in ("POST", "PUT", "PATCH"):
        return await call_next(request)

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"detail": f"Request exceeds maximum size of {MAX_REQUEST_SIZE} bytes"},
        )

    return await call_next(request)


# Middleware: Rate limiting
from middleware.rate_limit_middleware import RateLimitMiddleware
from config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW

app.add_middleware(
    RateLimitMiddleware,
    requests_per_window=RATE_LIMIT_REQUESTS,
    window_seconds=RATE_LIMIT_WINDOW,
)

# Middleware: Request logging
from middleware.logging_middleware import RequestLoggingMiddleware

app.add_middleware(RequestLoggingMiddleware)


# CORS: Restrict origins and methods
cors_origins = [origin.strip() for origin in CORS_ORIGINS if origin.strip()]
logger.info(f"CORS allowed origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    max_age=3600,
)


@app.get("/health")
async def health():
    """Health check endpoint with database verification."""
    from utils.circuit_breaker import circuit_breaker_manager

    db_status = await health_check_db()
    breaker_status = circuit_breaker_manager.status()

    response = {
        "status": db_status["status"],
        "database": db_status.get("database", "unknown"),
        "circuit_breakers": breaker_status,
    }

    status_code = 200 if db_status["status"] == "ok" else 503
    return JSONResponse(status_code=status_code, content=response)


@app.get("/status")
async def status_endpoint():
    """Detailed status endpoint."""
    from utils.circuit_breaker import circuit_breaker_manager

    return {
        "status": "healthy",
        "circuit_breakers": circuit_breaker_manager.status(),
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


# Register API routes
from auth_routes import router as auth_router

app.include_router(auth_router)
app.include_router(memory_router)


# Global error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
