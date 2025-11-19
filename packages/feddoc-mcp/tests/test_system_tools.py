"""Tests for system tools."""

import pytest
from src.tools.system import get_server_health_handler
from src.monitoring import PerformanceMonitor


class TestGetServerHealthHandler:
    """Test get_server_health tool handler."""

    @pytest.mark.asyncio
    async def test_get_server_health_success(self):
        """Test successful health check."""
        # Set up some metrics
        import src.monitoring

        old_monitor = src.monitoring._monitor
        monitor = PerformanceMonitor()
        src.monitoring._monitor = monitor

        try:
            # Record some activity
            monitor.record_cache_hit()
            monitor.record_cache_hit()
            monitor.record_cache_miss()
            monitor.record_response_time(45.5)
            monitor.record_api_call("congress")
            monitor.record_tool_call("search_bills")
            monitor.record_request()

            result = await get_server_health_handler({})

            assert len(result) == 1
            assert result[0]["type"] == "text"
            text = result[0]["text"]

            # Verify key information is present
            assert "Server Health Report" in text
            assert "Status:" in text
            assert "Hit Rate:" in text
            assert "Average Response Time:" in text
            assert "Total Requests:" in text
            assert "congress" in text
            assert "search_bills" in text

        finally:
            src.monitoring._monitor = old_monitor

    @pytest.mark.asyncio
    async def test_get_server_health_no_activity(self):
        """Test health check with no activity."""
        import src.monitoring

        old_monitor = src.monitoring._monitor
        monitor = PerformanceMonitor()
        src.monitoring._monitor = monitor

        try:
            result = await get_server_health_handler({})

            assert len(result) == 1
            assert result[0]["type"] == "text"
            text = result[0]["text"]

            # Should still return valid report
            assert "Server Health Report" in text
            assert "0.0%" in text or "0%" in text  # Cache hit rate
            assert "0.00ms" in text or "0 ms" in text  # Response time

        finally:
            src.monitoring._monitor = old_monitor

    @pytest.mark.asyncio
    async def test_get_server_health_with_errors(self):
        """Test health check showing errors."""
        import src.monitoring

        old_monitor = src.monitoring._monitor
        monitor = PerformanceMonitor()
        src.monitoring._monitor = monitor

        try:
            # Record errors
            for _ in range(5):
                monitor.record_error()
                monitor.record_request()

            result = await get_server_health_handler({})

            assert len(result) == 1
            text = result[0]["text"]

            assert "Error Count: 5" in text or "Error Count:5" in text

        finally:
            src.monitoring._monitor = old_monitor
