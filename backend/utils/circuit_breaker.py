"""Circuit breaker pattern implementation for resilience."""

import asyncio
import logging
import time
from enum import Enum
from typing import Callable, Any, Optional

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    """States for circuit breaker."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """Circuit breaker for protecting against cascading failures."""

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60,
        expected_exception: type = Exception,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.state = CircuitState.CLOSED

    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit."""
        if self.state != CircuitState.OPEN:
            return False

        if self.last_failure_time is None:
            return False

        elapsed = time.time() - self.last_failure_time
        return elapsed >= self.recovery_timeout

    async def call(self, coro: Callable[..., Any], *args, **kwargs) -> Any:
        """Execute coroutine with circuit breaker protection."""

        if self._should_attempt_reset():
            self.state = CircuitState.HALF_OPEN
            logger.info(f"[{self.name}] Circuit breaker transitioning to HALF_OPEN")

        if self.state == CircuitState.OPEN:
            raise RuntimeError(
                f"Circuit breaker '{self.name}' is OPEN. "
                f"Service temporarily unavailable. "
                f"Retry in {self.recovery_timeout}s."
            )

        try:
            result = await coro(*args, **kwargs)

            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                logger.info(f"[{self.name}] Circuit breaker reset to CLOSED")

            return result

        except self.expected_exception as exc:
            self.failure_count += 1
            self.last_failure_time = time.time()

            logger.warning(
                f"[{self.name}] Failure {self.failure_count}/{self.failure_threshold}: {exc}"
            )

            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                logger.error(
                    f"[{self.name}] Circuit breaker opened after "
                    f"{self.failure_count} failures"
                )

            raise


class CircuitBreakerManager:
    """Manager for multiple circuit breakers."""

    def __init__(self):
        self.breakers: dict[str, CircuitBreaker] = {}

    def get_or_create(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60,
        expected_exception: type = Exception,
    ) -> CircuitBreaker:
        """Get existing or create new circuit breaker."""
        if name not in self.breakers:
            self.breakers[name] = CircuitBreaker(
                name=name,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                expected_exception=expected_exception,
            )
        return self.breakers[name]

    async def call(
        self,
        breaker_name: str,
        coro: Callable[..., Any],
        *args,
        **kwargs,
    ) -> Any:
        """Execute with circuit breaker."""
        breaker = self.get_or_create(breaker_name)
        return await breaker.call(coro, *args, **kwargs)

    def reset(self, name: str) -> bool:
        """Reset a circuit breaker."""
        if name in self.breakers:
            breaker = self.breakers[name]
            breaker.state = CircuitState.CLOSED
            breaker.failure_count = 0
            logger.info(f"[{name}] Circuit breaker manually reset")
            return True
        return False

    def status(self) -> dict[str, dict[str, Any]]:
        """Get status of all circuit breakers."""
        return {
            name: {
                "state": breaker.state.value,
                "failures": breaker.failure_count,
                "threshold": breaker.failure_threshold,
            }
            for name, breaker in self.breakers.items()
        }


# Global circuit breaker manager
circuit_breaker_manager = CircuitBreakerManager()
