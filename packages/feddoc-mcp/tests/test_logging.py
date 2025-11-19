"""Tests for structured logging utilities."""

import json
import logging
from io import StringIO

from src.utils.logging import (
    JSONFormatter,
    setup_logging,
    generate_request_id,
    set_request_id,
    get_request_id,
    clear_request_id,
    RequestContext,
    log_with_context,
)


class TestJSONFormatter:
    """Test JSONFormatter class."""

    def test_basic_formatting(self):
        """Test basic JSON log formatting."""
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None,
        )

        formatted = formatter.format(record)
        log_data = json.loads(formatted)

        assert log_data["level"] == "INFO"
        assert log_data["logger"] == "test_logger"
        assert log_data["message"] == "Test message"
        assert "timestamp" in log_data
        assert log_data["source"]["line"] == 42

    def test_with_extra_context(self):
        """Test formatting with extra context."""
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None,
        )
        record.custom_field = "custom_value"
        record.tool = "search_bills"

        formatted = formatter.format(record)
        log_data = json.loads(formatted)

        assert log_data["custom_field"] == "custom_value"
        assert log_data["tool"] == "search_bills"

    def test_with_request_id(self):
        """Test formatting includes request ID from context."""
        formatter = JSONFormatter()
        request_id = "test-request-id-123"
        set_request_id(request_id)

        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None,
        )

        formatted = formatter.format(record)
        log_data = json.loads(formatted)

        assert log_data["request_id"] == request_id

        # Cleanup
        clear_request_id()

    def test_with_exception(self):
        """Test formatting with exception info."""
        formatter = JSONFormatter()

        try:
            raise ValueError("Test error")
        except ValueError:
            import sys

            exc_info = sys.exc_info()

        record = logging.LogRecord(
            name="test_logger",
            level=logging.ERROR,
            pathname="test.py",
            lineno=42,
            msg="Error occurred",
            args=(),
            exc_info=exc_info,
        )

        formatted = formatter.format(record)
        log_data = json.loads(formatted)

        assert "exception" in log_data
        assert log_data["exception"]["type"] == "ValueError"
        assert "Test error" in log_data["exception"]["message"]
        assert "traceback" in log_data["exception"]


class TestRequestID:
    """Test request ID utilities."""

    def teardown_method(self):
        """Clean up request ID after each test."""
        clear_request_id()

    def test_generate_request_id(self):
        """Test request ID generation."""
        request_id = generate_request_id()
        assert isinstance(request_id, str)
        assert len(request_id) > 0

        # Should generate unique IDs
        request_id2 = generate_request_id()
        assert request_id != request_id2

    def test_set_and_get_request_id(self):
        """Test setting and getting request ID."""
        request_id = "test-id-123"
        set_request_id(request_id)

        retrieved = get_request_id()
        assert retrieved == request_id

    def test_set_request_id_generates_if_none(self):
        """Test set_request_id generates ID if None provided."""
        returned_id = set_request_id(None)
        assert returned_id is not None
        assert get_request_id() == returned_id

    def test_clear_request_id(self):
        """Test clearing request ID."""
        set_request_id("test-id")
        assert get_request_id() is not None

        clear_request_id()
        assert get_request_id() is None

    def test_get_request_id_default_none(self):
        """Test get_request_id returns None by default."""
        assert get_request_id() is None


class TestRequestContext:
    """Test RequestContext context manager."""

    def teardown_method(self):
        """Clean up request ID after each test."""
        clear_request_id()

    def test_context_manager_sets_request_id(self):
        """Test RequestContext sets request ID."""
        assert get_request_id() is None

        with RequestContext() as request_id:
            assert request_id is not None
            assert get_request_id() == request_id

        # Should clear after context
        assert get_request_id() is None

    def test_context_manager_with_provided_id(self):
        """Test RequestContext with provided request ID."""
        custom_id = "custom-request-123"

        with RequestContext(custom_id) as request_id:
            assert request_id == custom_id
            assert get_request_id() == custom_id

    def test_context_manager_restores_previous_id(self):
        """Test RequestContext restores previous request ID."""
        outer_id = "outer-request"
        set_request_id(outer_id)

        with RequestContext() as inner_id:
            assert get_request_id() == inner_id
            assert inner_id != outer_id

        # Should restore outer ID
        assert get_request_id() == outer_id

    def test_nested_contexts(self):
        """Test nested RequestContext managers."""
        with RequestContext("level-1") as id1:
            assert get_request_id() == id1

            with RequestContext("level-2") as id2:
                assert get_request_id() == id2
                assert id2 == "level-2"

            # Should restore level-1
            assert get_request_id() == id1

        # Should clear after all contexts
        assert get_request_id() is None


class TestSetupLogging:
    """Test setup_logging function."""

    def teardown_method(self):
        """Clean up logging configuration."""
        # Reset logging
        root_logger = logging.getLogger()
        root_logger.handlers.clear()
        root_logger.setLevel(logging.WARNING)

    def test_setup_logging_json_format(self):
        """Test setup_logging with JSON format."""
        setup_logging(level="INFO", use_json=True)

        root_logger = logging.getLogger()
        assert root_logger.level == logging.INFO
        assert len(root_logger.handlers) > 0

        # Check that handler uses JSON formatter
        handler = root_logger.handlers[0]
        assert isinstance(handler.formatter, JSONFormatter)

    def test_setup_logging_text_format(self):
        """Test setup_logging with text format."""
        setup_logging(level="DEBUG", use_json=False)

        root_logger = logging.getLogger()
        assert root_logger.level == logging.DEBUG

        handler = root_logger.handlers[0]
        assert not isinstance(handler.formatter, JSONFormatter)

    def test_setup_logging_different_levels(self):
        """Test setup_logging with different log levels."""
        levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

        for level in levels:
            # Clean up
            root_logger = logging.getLogger()
            root_logger.handlers.clear()

            setup_logging(level=level, use_json=False)
            expected_level = getattr(logging, level)
            assert root_logger.level == expected_level


class TestLogWithContext:
    """Test log_with_context function."""

    def test_log_with_context(self):
        """Test logging with additional context."""
        # Create a string stream to capture logs
        stream = StringIO()
        handler = logging.StreamHandler(stream)
        handler.setFormatter(JSONFormatter())

        test_logger = logging.getLogger("test_context_logger")
        test_logger.handlers.clear()
        test_logger.addHandler(handler)
        test_logger.setLevel(logging.INFO)

        # Log with context
        log_with_context(
            test_logger,
            logging.INFO,
            "Test message",
            custom_field="value",
            tool="test_tool",
        )

        # Parse the JSON log
        stream.seek(0)
        log_output = stream.read()
        log_data = json.loads(log_output)

        assert log_data["message"] == "Test message"
        assert log_data["custom_field"] == "value"
        assert log_data["tool"] == "test_tool"
