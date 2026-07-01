"""Rate limiting middleware for protecting API from abuse."""

import logging
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware based on IP address."""

    def __init__(
        self,
        app,
        requests_per_window: int = 100,
        window_seconds: int = 3600,
    ):
        super().__init__(app)
        self.requests_per_window = requests_per_window
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        if request.client:
            return request.client.host

        # Fallback to X-Forwarded-For header
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        return "unknown"

    def _is_rate_limited(self, client_id: str) -> bool:
        """Check if client is rate limited."""
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old requests
        self.requests[client_id] = [
            req_time
            for req_time in self.requests[client_id]
            if req_time > window_start
        ]

        # Check limit
        if len(self.requests[client_id]) >= self.requests_per_window:
            return True

        # Record request
        self.requests[client_id].append(now)
        return False

    async def dispatch(self, request: Request, call_next: Callable) -> JSONResponse:
        """Rate limit requests."""

        client_id = self._get_client_ip(request)

        if self._is_rate_limited(client_id):
            logger.warning(f"Rate limit exceeded for client {client_id}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {self.requests_per_window} "
                    f"requests per {self.window_seconds} seconds."
                },
            )

        return await call_next(request)
