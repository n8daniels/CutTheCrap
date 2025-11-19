"""
Structured logging utilities for FedDocMCP.

Provides JSON-formatted logging with request IDs and contextual information
for better debugging and log analysis.
"""

import json
import uuid
import logging
import sys
from typing import Any, Dict, Optional
from contextvars import ContextVar
from datetime import datetime


# Context variable to store request ID across async calls
request_id_context: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.

    Outputs log records as JSON objects with consistent fields including
    timestamp, level, message, request_id, and any extra context.
    """

    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as JSON.

        Args:
            record: Log record to format

        Returns:
            JSON-formatted log string
        """
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add request ID if available
        request_id = get_request_id()
        if request_id:
            log_data["request_id"] = request_id

        # Add extra context from record
        # Skip standard LogRecord attributes
        skip_attrs = {
            "name",
            "msg",
            "args",
            "created",
            "filename",
            "funcName",
            "levelname",
            "levelno",
            "lineno",
            "module",
            "msecs",
            "message",
            "pathname",
            "process",
            "processName",
            "relativeCreated",
            "thread",
            "threadName",
            "exc_info",
            "exc_text",
            "stack_info",
        }

        for key, value in record.__dict__.items():
            if key not in skip_attrs and not key.startswith("_"):
                log_data[key] = value

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": (
                    self.formatException(record.exc_info) if record.exc_info else None
                ),
            }

        # Add source location
        log_data["source"] = {
            "file": record.pathname,
            "line": record.lineno,
            "function": record.funcName,
        }

        return json.dumps(log_data)


def setup_logging(
    level: str = "INFO",
    use_json: bool = True,
    log_file: Optional[str] = None,
) -> None:
    """
    Configure structured logging for the application.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_json: Whether to use JSON formatting (default: True)
        log_file: Optional file path for logging (default: stderr only)
    """
    # Convert level string to logging constant
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Remove existing handlers
    root_logger.handlers.clear()

    # Create formatter
    formatter: logging.Formatter
    if use_json:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    # Console handler (stderr to avoid interfering with MCP stdio)
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler if specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(numeric_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    # Set level for noisy libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)


def generate_request_id() -> str:
    """
    Generate a unique request ID.

    Returns:
        UUID string to use as request ID
    """
    return str(uuid.uuid4())


def set_request_id(request_id: Optional[str] = None) -> str:
    """
    Set the current request ID in context.

    Args:
        request_id: Request ID to set (generates new one if None)

    Returns:
        The request ID that was set
    """
    if request_id is None:
        request_id = generate_request_id()
    request_id_context.set(request_id)
    return request_id


def get_request_id() -> Optional[str]:
    """
    Get the current request ID from context.

    Returns:
        Current request ID or None if not set
    """
    return request_id_context.get()


def clear_request_id() -> None:
    """Clear the current request ID from context."""
    request_id_context.set(None)


class RequestContext:
    """
    Context manager for request-scoped logging.

    Automatically generates and manages request ID for the duration
    of the context.

    Usage:
        with RequestContext() as request_id:
            logger.info("Processing request")
            # All logs in this context will include request_id
    """

    def __init__(self, request_id: Optional[str] = None):
        """
        Initialize request context.

        Args:
            request_id: Optional request ID (generates new one if None)
        """
        self.request_id = request_id or generate_request_id()
        self.previous_id: Optional[str] = None

    def __enter__(self) -> str:
        """
        Enter context and set request ID.

        Returns:
            The request ID for this context
        """
        self.previous_id = get_request_id()
        set_request_id(self.request_id)
        return self.request_id

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """
        Exit context and restore previous request ID.

        Args:
            exc_type: Exception type if raised
            exc_val: Exception value if raised
            exc_tb: Exception traceback if raised
        """
        # Restore previous request ID
        if self.previous_id:
            set_request_id(self.previous_id)
        else:
            clear_request_id()


def log_with_context(
    logger: logging.Logger,
    level: int,
    message: str,
    **context: Any,
) -> None:
    """
    Log a message with additional context.

    Args:
        logger: Logger to use
        level: Log level (e.g., logging.INFO)
        message: Log message
        **context: Additional context key-value pairs
    """
    logger.log(level, message, extra=context)
