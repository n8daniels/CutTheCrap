"""Tests for performance monitoring."""

import pytest
import asyncio
from src.monitoring import (
    PerformanceMetrics,
    PerformanceMonitor,
    get_monitor,
    monitored_tool,
)


class TestPerformanceMetrics:
    """Test PerformanceMetrics dataclass."""

    def test_initial_values(self):
        """Test initial metrics values."""
        metrics = PerformanceMetrics()
        assert metrics.cache_hits == 0
        assert metrics.cache_misses == 0
        assert metrics.total_requests == 0
        assert metrics.error_count == 0
        assert metrics.api_calls == {}
        assert metrics.response_times == []
        assert metrics.tool_calls == {}

    def test_cache_hit_rate_zero_operations(self):
        """Test cache hit rate with zero operations."""
        metrics = PerformanceMetrics()
        assert metrics.get_cache_hit_rate() == 0.0

    def test_cache_hit_rate_calculation(self):
        """Test cache hit rate calculation."""
        metrics = PerformanceMetrics()
        metrics.cache_hits = 70
        metrics.cache_misses = 30
        assert metrics.get_cache_hit_rate() == 70.0

    def test_avg_response_time_no_data(self):
        """Test average response time with no data."""
        metrics = PerformanceMetrics()
        assert metrics.get_avg_response_time() == 0.0

    def test_avg_response_time_calculation(self):
        """Test average response time calculation."""
        metrics = PerformanceMetrics()
        metrics.response_times = [10.0, 20.0, 30.0]
        assert metrics.get_avg_response_time() == 20.0

    def test_total_api_calls(self):
        """Test total API calls calculation."""
        metrics = PerformanceMetrics()
        metrics.api_calls = {"congress": 10, "federal_register": 5}
        assert metrics.get_total_api_calls() == 15


class TestPerformanceMonitor:
    """Test PerformanceMonitor class."""

    def test_initialization(self):
        """Test monitor initialization."""
        monitor = PerformanceMonitor()
        assert isinstance(monitor.metrics, PerformanceMetrics)
        assert monitor.metrics.cache_hits == 0

    def test_record_cache_hit(self):
        """Test recording cache hit."""
        monitor = PerformanceMonitor()
        monitor.record_cache_hit()
        assert monitor.metrics.cache_hits == 1

    def test_record_cache_miss(self):
        """Test recording cache miss."""
        monitor = PerformanceMonitor()
        monitor.record_cache_miss()
        assert monitor.metrics.cache_misses == 1

    def test_record_request(self):
        """Test recording request."""
        monitor = PerformanceMonitor()
        monitor.record_request()
        assert monitor.metrics.total_requests == 1

    def test_record_error(self):
        """Test recording error."""
        monitor = PerformanceMonitor()
        monitor.record_error()
        assert monitor.metrics.error_count == 1

    def test_record_api_call(self):
        """Test recording API call."""
        monitor = PerformanceMonitor()
        monitor.record_api_call("congress")
        monitor.record_api_call("congress")
        monitor.record_api_call("federal_register")
        assert monitor.metrics.api_calls["congress"] == 2
        assert monitor.metrics.api_calls["federal_register"] == 1

    def test_record_tool_call(self):
        """Test recording tool call."""
        monitor = PerformanceMonitor()
        monitor.record_tool_call("search_bills")
        monitor.record_tool_call("search_bills")
        monitor.record_tool_call("get_bill_text")
        assert monitor.metrics.tool_calls["search_bills"] == 2
        assert monitor.metrics.tool_calls["get_bill_text"] == 1

    def test_record_response_time(self):
        """Test recording response time."""
        monitor = PerformanceMonitor()
        monitor.record_response_time(10.5)
        monitor.record_response_time(20.3)
        assert len(monitor.metrics.response_times) == 2
        assert monitor.metrics.response_times[0] == 10.5

    def test_record_response_time_limit(self):
        """Test response time list is limited to 1000 entries."""
        monitor = PerformanceMonitor()
        for i in range(1100):
            monitor.record_response_time(float(i))
        assert len(monitor.metrics.response_times) == 1000
        # Should keep the most recent 1000
        assert monitor.metrics.response_times[0] == 100.0

    def test_get_health_status_healthy(self):
        """Test health status when healthy."""
        monitor = PerformanceMonitor()
        monitor.record_response_time(50.0)
        monitor.record_cache_hit()
        assert "HEALTHY" in monitor.get_health_status()

    def test_get_health_status_slow(self):
        """Test health status when slow."""
        monitor = PerformanceMonitor()
        monitor.record_response_time(250.0)
        assert "SLOW" in monitor.get_health_status()

    def test_get_health_status_low_cache_rate(self):
        """Test health status with low cache hit rate."""
        monitor = PerformanceMonitor()
        monitor.record_response_time(50.0)
        for _ in range(20):
            monitor.record_cache_miss()
        for _ in range(5):
            monitor.record_cache_hit()
        assert "LOW CACHE HIT RATE" in monitor.get_health_status()

    def test_get_health_status_errors(self):
        """Test health status with errors."""
        monitor = PerformanceMonitor()
        monitor.record_response_time(50.0)
        for _ in range(15):
            monitor.record_error()
        assert "ERRORS" in monitor.get_health_status()

    def test_get_health_report(self):
        """Test comprehensive health report."""
        monitor = PerformanceMonitor()
        monitor.record_cache_hit()
        monitor.record_cache_hit()
        monitor.record_cache_miss()
        monitor.record_response_time(25.5)
        monitor.record_response_time(35.5)
        monitor.record_api_call("congress")
        monitor.record_tool_call("search_bills")
        monitor.record_request()
        monitor.record_request()
        monitor.record_error()

        report = monitor.get_health_report()

        assert report["status"] is not None
        assert report["cache"]["hits"] == 2
        assert report["cache"]["misses"] == 1
        assert report["cache"]["hit_rate"] == "66.7%"
        assert report["performance"]["avg_response_time_ms"] == 30.5
        assert report["performance"]["total_requests"] == 2
        assert report["api_calls"]["total"] == 1
        assert report["api_calls"]["by_api"]["congress"] == 1
        assert report["tools"]["total_calls"] == 1
        assert report["tools"]["by_tool"]["search_bills"] == 1
        assert report["errors"]["count"] == 1

    def test_reset(self):
        """Test resetting metrics."""
        monitor = PerformanceMonitor()
        monitor.record_cache_hit()
        monitor.record_api_call("congress")
        monitor.record_tool_call("search_bills")

        monitor.reset()

        assert monitor.metrics.cache_hits == 0
        assert monitor.metrics.api_calls == {}
        assert monitor.metrics.tool_calls == {}


class TestMonitoredDecorator:
    """Test monitored_tool decorator."""

    @pytest.mark.asyncio
    async def test_monitored_tool_success(self):
        """Test monitored_tool decorator with successful execution."""
        monitor = PerformanceMonitor()

        @monitored_tool
        async def test_tool(arguments):
            await asyncio.sleep(0.01)  # Simulate some work
            return [{"type": "text", "text": "Success"}]

        # Temporarily replace global monitor
        import src.monitoring

        old_monitor = src.monitoring._monitor
        src.monitoring._monitor = monitor

        try:
            result = await test_tool({"query": "test"})

            assert result == [{"type": "text", "text": "Success"}]
            assert monitor.metrics.tool_calls["test_tool"] == 1
            assert monitor.metrics.total_requests == 1
            assert len(monitor.metrics.response_times) == 1
            assert monitor.metrics.response_times[0] >= 10.0  # At least 10ms
            assert monitor.metrics.error_count == 0

        finally:
            src.monitoring._monitor = old_monitor

    @pytest.mark.asyncio
    async def test_monitored_tool_with_cache(self):
        """Test monitored_tool decorator with cache indication."""
        monitor = PerformanceMonitor()

        @monitored_tool
        async def test_tool_cached(arguments):
            return [{"type": "text", "text": "Cached", "from_cache": True}]

        import src.monitoring

        old_monitor = src.monitoring._monitor
        src.monitoring._monitor = monitor

        try:
            await test_tool_cached({})

            # Should record cache hit because from_cache=True
            assert monitor.metrics.cache_hits == 1
            assert monitor.metrics.cache_misses == 0

        finally:
            src.monitoring._monitor = old_monitor

    @pytest.mark.asyncio
    async def test_monitored_tool_error(self):
        """Test monitored_tool decorator with error."""
        monitor = PerformanceMonitor()

        @monitored_tool
        async def test_tool_error(arguments):
            raise ValueError("Test error")

        import src.monitoring

        old_monitor = src.monitoring._monitor
        src.monitoring._monitor = monitor

        try:
            with pytest.raises(ValueError, match="Test error"):
                await test_tool_error({})

            assert monitor.metrics.error_count == 1
            assert len(monitor.metrics.response_times) == 1

        finally:
            src.monitoring._monitor = old_monitor


class TestGetMonitor:
    """Test get_monitor function."""

    def test_get_monitor_singleton(self):
        """Test that get_monitor returns singleton instance."""
        monitor1 = get_monitor()
        monitor2 = get_monitor()
        assert monitor1 is monitor2
