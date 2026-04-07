"""
Performance monitoring for MCP server.

Tracks cache hits/misses, response times, API calls, and provides health metrics.
"""

import time
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable, TypeVar, cast
from functools import wraps
import asyncio

from .utils.logging import RequestContext


logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance metrics for the MCP server."""

    cache_hits: int = 0
    cache_misses: int = 0
    total_requests: int = 0
    error_count: int = 0
    api_calls: Dict[str, int] = field(default_factory=dict)  # API name -> count
    response_times: List[float] = field(default_factory=list)  # milliseconds
    tool_calls: Dict[str, int] = field(default_factory=dict)  # tool name -> count

    def get_cache_hit_rate(self) -> float:
        """Calculate cache hit rate as percentage."""
        total = self.cache_hits + self.cache_misses
        if total == 0:
            return 0.0
        return (self.cache_hits / total) * 100

    def get_avg_response_time(self) -> float:
        """Calculate average response time in milliseconds."""
        if not self.response_times:
            return 0.0
        # Keep only last 1000 measurements to avoid memory issues
        recent = self.response_times[-1000:]
        return sum(recent) / len(recent)

    def get_total_api_calls(self) -> int:
        """Get total number of API calls across all APIs."""
        return sum(self.api_calls.values())


class PerformanceMonitor:
    """
    Monitor and track performance metrics for the MCP server.

    Tracks:
    - Cache hit/miss rates
    - Response times
    - API call counts
    - Error rates
    - Tool usage
    """

    def __init__(self) -> None:
        """Initialize performance monitor."""
        self.metrics = PerformanceMetrics()
        self._lock = asyncio.Lock()
        logger.info("Performance monitor initialized")

    def record_cache_hit(self) -> None:
        """Record a cache hit."""
        self.metrics.cache_hits += 1

    def record_cache_miss(self) -> None:
        """Record a cache miss."""
        self.metrics.cache_misses += 1

    def record_request(self) -> None:
        """Record a request."""
        self.metrics.total_requests += 1

    def record_error(self) -> None:
        """Record an error."""
        self.metrics.error_count += 1

    def record_api_call(self, api_name: str) -> None:
        """
        Record an API call.

        Args:
            api_name: Name of the API (e.g., 'congress', 'federal_register')
        """
        if api_name not in self.metrics.api_calls:
            self.metrics.api_calls[api_name] = 0
        self.metrics.api_calls[api_name] += 1

    def record_tool_call(self, tool_name: str) -> None:
        """
        Record a tool call.

        Args:
            tool_name: Name of the tool being called
        """
        if tool_name not in self.metrics.tool_calls:
            self.metrics.tool_calls[tool_name] = 0
        self.metrics.tool_calls[tool_name] += 1

    def record_response_time(self, duration_ms: float) -> None:
        """
        Record response time.

        Args:
            duration_ms: Response time in milliseconds
        """
        self.metrics.response_times.append(duration_ms)
        # Keep only last 1000 to avoid memory issues
        if len(self.metrics.response_times) > 1000:
            self.metrics.response_times = self.metrics.response_times[-1000:]

    def get_health_status(self) -> str:
        """
        Determine overall health status.

        Returns:
            Health status string with emoji
        """
        avg_time = self.metrics.get_avg_response_time()
        cache_rate = self.metrics.get_cache_hit_rate()
        error_rate = self.metrics.error_count

        if avg_time > 200:
            return "⚠️  SLOW - Average response time high"
        if cache_rate < 60 and self.metrics.cache_hits + self.metrics.cache_misses > 10:
            return "⚠️  LOW CACHE HIT RATE - Check caching strategy"
        if error_rate > 10:
            return "❌ ERRORS - Investigate failures"
        return "✅ HEALTHY"

    def get_health_report(self) -> Dict[str, Any]:
        """
        Get comprehensive health report.

        Returns:
            Dictionary with all health metrics
        """
        total_cache_ops = self.metrics.cache_hits + self.metrics.cache_misses
        cache_hit_rate = self.metrics.get_cache_hit_rate()

        return {
            "status": self.get_health_status(),
            "uptime_info": "Session-based (no persistent state)",
            "cache": {
                "hit_rate": f"{cache_hit_rate:.1f}%",
                "hits": self.metrics.cache_hits,
                "misses": self.metrics.cache_misses,
                "total_operations": total_cache_ops,
            },
            "performance": {
                "avg_response_time_ms": round(self.metrics.get_avg_response_time(), 2),
                "total_requests": self.metrics.total_requests,
                "samples_tracked": len(self.metrics.response_times),
            },
            "api_calls": {
                "total": self.metrics.get_total_api_calls(),
                "by_api": dict(self.metrics.api_calls),
            },
            "tools": {
                "total_calls": sum(self.metrics.tool_calls.values()),
                "by_tool": dict(self.metrics.tool_calls),
            },
            "errors": {
                "count": self.metrics.error_count,
                "rate": f"{(self.metrics.error_count / max(1, self.metrics.total_requests) * 100):.2f}%",
            },
        }

    def reset(self) -> None:
        """Reset all metrics. Use with caution."""
        self.metrics = PerformanceMetrics()
        logger.info("Performance metrics reset")


# Global monitor instance
_monitor: Optional[PerformanceMonitor] = None


def get_monitor() -> PerformanceMonitor:
    """
    Get the global performance monitor instance.

    Returns:
        Global PerformanceMonitor instance
    """
    global _monitor
    if _monitor is None:
        _monitor = PerformanceMonitor()
    return _monitor


F = TypeVar("F", bound=Callable[..., Any])


def monitored_tool(func: F) -> F:
    """
    Automatically monitor tool execution.

    Tracks:
    - Tool call counts
    - Response times
    - Errors
    - Cache hits/misses (if result includes from_cache)

    Usage:
        @monitored_tool
        async def my_tool_handler(arguments):
            ...
    """

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        # Create request context for this tool call
        with RequestContext() as request_id:
            monitor = get_monitor()
            tool_name = func.__name__.replace("_handler", "")

            monitor.record_tool_call(tool_name)
            monitor.record_request()

            logger.info(
                f"Tool call started: {tool_name}",
                extra={"tool": tool_name, "request_id": request_id},
            )

            start = time.time()
            try:
                result = await func(*args, **kwargs)

                # Check if result indicates cache usage
                # Assumes result is a list of dicts with optional metadata
                if isinstance(result, list) and len(result) > 0:
                    first_item = result[0]
                    if isinstance(first_item, dict) and first_item.get("from_cache"):
                        monitor.record_cache_hit()
                    elif isinstance(first_item, dict) and "from_cache" in first_item:
                        monitor.record_cache_miss()

                duration_ms = (time.time() - start) * 1000
                monitor.record_response_time(duration_ms)

                logger.info(
                    f"Tool call completed: {tool_name}",
                    extra={
                        "tool": tool_name,
                        "duration_ms": duration_ms,
                        "status": "success",
                        "cached": (
                            first_item.get("from_cache", False)
                            if isinstance(result, list) and result
                            else False
                        ),
                    },
                )

                return result

            except Exception as e:
                monitor.record_error()
                duration_ms = (time.time() - start) * 1000
                monitor.record_response_time(duration_ms)

                logger.error(
                    f"Tool call failed: {tool_name}",
                    extra={
                        "tool": tool_name,
                        "duration_ms": duration_ms,
                        "status": "error",
                        "error": str(e),
                        "error_type": type(e).__name__,
                    },
                    exc_info=True,
                )
                raise

    return cast(F, wrapper)
