"""Request/response logging middleware for structured logging."""

import logging
import time
import uuid
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log HTTP requests and responses with request ID tracking."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id

        # Log request
        logger.info(
            f"[{request_id}] {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client": request.client.host if request.client else "unknown",
            },
        )

        start_time = time.time()

        try:
            response = await call_next(request)
        except Exception as exc:
            duration = time.time() - start_time
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} "
                f"ERROR ({duration:.2f}s): {exc}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration": duration,
                    "error": str(exc),
                },
            )
            raise

        duration = time.time() - start_time

        # Log response
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"→ {response.status_code} ({duration:.2f}s)",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration": duration,
            },
        )

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id

        return response
