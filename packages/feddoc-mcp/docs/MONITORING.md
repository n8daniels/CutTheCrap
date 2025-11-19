# Monitoring and Observability

FedDocMCP includes comprehensive monitoring and observability features to help you understand server performance, debug issues, and optimize cache behavior.

## Table of Contents

- [Overview](#overview)
- [Performance Monitoring](#performance-monitoring)
- [Cache Statistics](#cache-statistics)
- [Structured Logging](#structured-logging)
- [Health Checks](#health-checks)
- [Integration Examples](#integration-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

FedDocMCP provides three integrated monitoring systems:

1. **Performance Monitoring** - Real-time tracking of cache hits/misses, response times, API calls, and errors
2. **Cache Statistics** - Detailed metadata tracking for cache entries with access patterns and memory usage
3. **Structured Logging** - JSON-formatted logs with request ID correlation and context tracking

All three systems work together to provide complete observability into server operations.

## Performance Monitoring

### Architecture

The performance monitoring system is implemented in `src/monitoring.py` and provides:

- **PerformanceMetrics** - Dataclass storing server-wide metrics
- **PerformanceMonitor** - Singleton class managing metric collection
- **monitored_tool** - Decorator automatically wrapping all tool handlers

### Tracked Metrics

| Metric | Description | Usage |
|--------|-------------|-------|
| `cache_hits` | Number of successful cache retrievals | Optimize cache TTL |
| `cache_misses` | Number of cache misses requiring API calls | Identify popular queries |
| `total_requests` | Total requests processed | Server load monitoring |
| `error_count` | Number of errors encountered | Error rate tracking |
| `api_calls` | API calls by service (congress, federal_register) | Rate limit monitoring |
| `response_times` | Response times (last 1000 requests) | Performance optimization |
| `tool_calls` | Calls per tool | Usage pattern analysis |

### Accessing Metrics

#### Programmatically

```python
from src.monitoring import get_monitor

monitor = get_monitor()
health_report = monitor.get_health_report()

print(f"Status: {health_report['status']}")
print(f"Cache hit rate: {health_report['cache']['hit_rate']:.1%}")
print(f"Avg response time: {health_report['performance']['avg_response_time_ms']:.2f}ms")
```

#### Via MCP Tool

Use the `get_server_health` tool from any MCP client:

```
Check server health
Show me performance metrics
```

#### Health Status Indicators

- ✅ **HEALTHY** - All systems operating normally
- ⚠️ **DEGRADED** - Performance issues detected (slow responses or low cache hit rate)
- ❌ **UNHEALTHY** - Critical issues (high error rate >5%)

### Health Check Thresholds

```python
# Default thresholds (configurable in src/monitoring.py)
ERROR_RATE_THRESHOLD = 0.05      # 5% error rate
CACHE_HIT_RATE_THRESHOLD = 0.30  # 30% cache hit rate
AVG_RESPONSE_TIME_THRESHOLD = 2000.0  # 2 seconds
```

### Automatic Monitoring

All tool handlers are automatically monitored using the `@monitored_tool` decorator:

```python
from src.monitoring import monitored_tool

@monitored_tool
async def search_bills_handler(arguments: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Automatically tracked: duration, errors, cache hits."""
    # Tool implementation
    pass
```

The decorator automatically:
- Records request start/completion
- Tracks execution duration
- Logs cache hit/miss status
- Records errors and exceptions
- Updates performance metrics

## Cache Statistics

### Architecture

Cache statistics are implemented in `src/utils/cache.py` with two main classes:

- **CacheEntry** - Individual cache entry with metadata
- **CacheStats** - Aggregate statistics across all cache entries

Both API clients (`CongressAPIClient` and `FederalRegisterClient`) use these utilities.

### CacheEntry Metadata

Each cached response includes:

```python
@dataclass
class CacheEntry:
    data: Dict[str, Any]          # The cached response
    created_at: float             # Timestamp when created
    last_accessed: float          # Timestamp of last access
    access_count: int             # Number of accesses
    version: str                  # Cache version for invalidation
    ttl: Optional[float]          # Custom TTL (None = use default)

    # Computed properties
    age: float                    # Age in seconds
    time_since_access: float      # Seconds since last access
    size: int                     # Approximate size in bytes
```

### Cache Statistics

Aggregate statistics tracked per API client:

```python
stats = client.get_cache_stats()

# Returns:
{
    "hits": 45,
    "misses": 12,
    "total_requests": 57,
    "hit_rate": 0.789,           # 78.9%
    "expirations": 3,
    "evictions": 0,
    "total_size_bytes": 125340,
    "entries": 15,
    "avg_entry_age": 145.2,      # seconds
    "max_entry_age": 298.5,
    "avg_access_count": 3.0,
    "max_access_count": 12
}
```

### Using Cache Statistics

#### Check Cache Performance

```python
from src.clients.congress_api import CongressAPIClient

async with CongressAPIClient() as client:
    # Make some requests
    await client.search_bills(query="climate")
    await client.search_bills(query="climate")  # Cache hit

    # Check stats
    stats = client.get_cache_stats()
    print(f"Hit rate: {stats['hit_rate']:.1%}")
    print(f"Total cache size: {stats['total_size_bytes']:,} bytes")
    print(f"Average accesses per entry: {stats['avg_access_count']:.1f}")
```

#### Identify Hot/Cold Data

```python
# Access individual cache entries
for key, entry in client._cache.items():
    if entry.access_count > 10:
        print(f"Hot: {key} - {entry.access_count} accesses")
    elif entry.time_since_access > 3600:
        print(f"Cold: {key} - not accessed in {entry.time_since_access:.0f}s")
```

### Cache Configuration

```python
# Custom TTL per client
client = CongressAPIClient(cache_ttl=600)  # 10 minutes

# Custom TTL per entry (future enhancement)
entry = CacheEntry(data=response, ttl=1800)  # 30 minutes
```

## Structured Logging

### Architecture

Structured logging is implemented in `src/utils/logging.py` and provides:

- **JSONFormatter** - Formats logs as JSON with consistent fields
- **Request ID Tracking** - Uses Python `ContextVar` for async-safe correlation
- **RequestContext** - Context manager for request-scoped logging

### Log Format

All logs are output as JSON with consistent fields:

```json
{
  "timestamp": "2024-01-15T10:30:45.123456Z",
  "level": "INFO",
  "logger": "src.tools.bills",
  "message": "Tool call completed: search_bills",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tool": "search_bills",
  "duration_ms": 234.5,
  "status": "success",
  "cached": "miss",
  "source": {
    "file": "/path/to/monitoring.py",
    "line": 245,
    "function": "wrapper"
  }
}
```

### Configuration

Configure logging via environment variables:

```bash
# Set log level
export LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# Choose format
export LOG_FORMAT=json  # json or text

# Optional: log to file
export LOG_FILE=/var/log/feddocmcp.log
```

### Request ID Correlation

Request IDs automatically correlate all logs from a single tool call:

```python
from src.utils.logging import RequestContext, get_request_id

# Automatic (handled by monitored_tool decorator)
with RequestContext() as request_id:
    logger.info("Processing request")  # Includes request_id
    # ... do work ...
    logger.info("Request complete")     # Same request_id

# Manual
from src.utils.logging import set_request_id, get_request_id

set_request_id("custom-id-123")
current_id = get_request_id()  # "custom-id-123"
```

### Log Filtering and Analysis

#### Using jq (JSON processor)

```bash
# Filter by log level
tail -f logs.json | jq 'select(.level == "ERROR")'

# Filter by tool
tail -f logs.json | jq 'select(.tool == "search_bills")'

# Find slow requests
tail -f logs.json | jq 'select(.duration_ms > 1000)'

# Group by request ID
tail -f logs.json | jq -s 'group_by(.request_id)'
```

#### Using Python

```python
import json

# Parse log file
with open("logs.json") as f:
    for line in f:
        log = json.loads(line)
        if log.get("level") == "ERROR":
            print(f"{log['timestamp']}: {log['message']}")
            if "exception" in log:
                print(log["exception"]["traceback"])
```

### Adding Custom Context

```python
import logging
logger = logging.getLogger(__name__)

# Add custom fields using 'extra'
logger.info(
    "Processing bill",
    extra={
        "bill_number": "H.R. 1",
        "congress": 118,
        "user_id": "user123"
    }
)

# Output includes custom fields
# {"timestamp": "...", "message": "Processing bill",
#  "bill_number": "H.R. 1", "congress": 118, "user_id": "user123"}
```

## Health Checks

### get_server_health Tool

The `get_server_health` MCP tool provides a formatted health report:

**Example Output:**

```
🏥 FedDocMCP Server Health Report

Status: ✅ HEALTHY

📊 Cache Statistics:
  Total Operations: 157
  Cache Hits: 124 (79.0%)
  Cache Misses: 33 (21.0%)

⚡ Performance:
  Total Requests: 157
  Error Count: 2 (1.3%)
  Average Response Time: 234.5ms

🔌 API Calls:
  congress: 28
  federal_register: 5
  Total: 33

🛠️ Tool Usage:
  search_bills: 45
  get_bill_text: 12
  search_regulations: 8
  get_server_health: 1
```

### Programmatic Health Checks

```python
from src.monitoring import get_monitor

monitor = get_monitor()
report = monitor.get_health_report()

if report["status"] == "UNHEALTHY":
    # Alert on critical issues
    send_alert(f"Server unhealthy: {report['issues']}")
elif report["status"] == "DEGRADED":
    # Log warnings
    logger.warning(f"Performance degraded: {report['warnings']}")
```

## Integration Examples

### Example 1: Monitor Cache Efficiency

```python
import asyncio
from src.clients.congress_api import CongressAPIClient
from src.monitoring import get_monitor

async def monitor_cache():
    async with CongressAPIClient() as client:
        # Simulate workload
        queries = ["climate change", "infrastructure", "climate change"]

        for query in queries:
            await client.search_bills(query=query)

        # Check cache performance
        cache_stats = client.get_cache_stats()
        monitor_stats = get_monitor().get_health_report()

        print(f"Cache hit rate: {cache_stats['hit_rate']:.1%}")
        print(f"Memory used: {cache_stats['total_size_bytes']:,} bytes")
        print(f"Avg response: {monitor_stats['performance']['avg_response_time_ms']:.2f}ms")

asyncio.run(monitor_cache())
```

### Example 2: Track Request Flow

```python
import logging
from src.utils.logging import RequestContext, setup_logging

# Enable structured logging
setup_logging(level="DEBUG", use_json=True)
logger = logging.getLogger(__name__)

async def process_request(user_query: str):
    with RequestContext() as request_id:
        logger.info("Request started", extra={"query": user_query})

        try:
            # Process request
            result = await search_bills(query=user_query)
            logger.info("Request completed", extra={"results": len(result)})
            return result
        except Exception as e:
            logger.error("Request failed", extra={"error": str(e)}, exc_info=True)
            raise

# All logs will have the same request_id
```

### Example 3: Performance Alerts

```python
from src.monitoring import get_monitor
import logging

logger = logging.getLogger(__name__)

def check_performance():
    """Check performance and log warnings."""
    monitor = get_monitor()
    metrics = monitor.metrics

    # Check cache efficiency
    cache_hit_rate = metrics.cache_hit_rate
    if cache_hit_rate < 0.5 and metrics.total_requests > 100:
        logger.warning(
            f"Low cache hit rate: {cache_hit_rate:.1%}",
            extra={"threshold": 0.5, "actual": cache_hit_rate}
        )

    # Check response times
    avg_time = metrics.avg_response_time
    if avg_time > 1000:  # 1 second
        logger.warning(
            f"Slow average response time: {avg_time:.2f}ms",
            extra={"threshold_ms": 1000, "actual_ms": avg_time}
        )

    # Check error rate
    if metrics.total_requests > 0:
        error_rate = metrics.error_count / metrics.total_requests
        if error_rate > 0.05:  # 5%
            logger.error(
                f"High error rate: {error_rate:.1%}",
                extra={"threshold": 0.05, "actual": error_rate}
            )
```

## Best Practices

### 1. Regular Health Checks

Query server health periodically to catch issues early:

```bash
# Call get_server_health every 5 minutes
while true; do
  echo "$(date): Checking health..."
  # Use your MCP client to call get_server_health
  sleep 300
done
```

### 2. Log Analysis

Set up log aggregation and analysis:

```bash
# Ship logs to aggregation service
tail -f /var/log/feddocmcp.log | \
  jq -c . | \
  curl -X POST https://logs.example.com/ingest -d @-
```

### 3. Cache Tuning

Monitor cache hit rates and adjust TTL:

```python
# If hit rate is low, increase TTL
if cache_stats['hit_rate'] < 0.5:
    client = CongressAPIClient(cache_ttl=900)  # 15 minutes

# If hit rate is high but entries are old, decrease TTL
if cache_stats['avg_entry_age'] > 600:
    client = CongressAPIClient(cache_ttl=300)  # 5 minutes
```

### 4. Request Correlation

Always use request IDs to correlate logs:

```bash
# Find all logs for a specific request
grep "a1b2c3d4-e5f6-7890" logs.json | jq -s .
```

### 5. Error Monitoring

Set up alerts for error rate spikes:

```python
# Monitor error rate
error_rate = monitor.metrics.error_count / monitor.metrics.total_requests
if error_rate > 0.05:
    send_alert("Error rate exceeds 5%")
```

## Troubleshooting

### High Cache Miss Rate

**Symptoms:** Cache hit rate < 30%, many API calls

**Diagnosis:**
```python
stats = client.get_cache_stats()
print(f"Hit rate: {stats['hit_rate']:.1%}")
print(f"Entries: {stats['entries']}")
print(f"Avg age: {stats['avg_entry_age']:.1f}s")
```

**Solutions:**
- Increase cache TTL: `CongressAPIClient(cache_ttl=900)`
- Check for unique queries (each unique query is a cache miss)
- Verify queries are consistent (parameters in same order)

### Slow Response Times

**Symptoms:** Average response time > 2 seconds

**Diagnosis:**
```python
report = get_monitor().get_health_report()
print(f"Avg: {report['performance']['avg_response_time_ms']:.2f}ms")
print(f"Cache hit rate: {report['cache']['hit_rate']:.1%}")
```

**Solutions:**
- Improve cache hit rate (see above)
- Check network latency to Congress.gov API
- Review slow queries in logs: `jq 'select(.duration_ms > 2000)'`

### High Memory Usage

**Symptoms:** Large cache size, memory pressure

**Diagnosis:**
```python
stats = client.get_cache_stats()
print(f"Total size: {stats['total_size_bytes']:,} bytes")
print(f"Entries: {stats['entries']}")
print(f"Avg size: {stats['total_size_bytes'] / stats['entries']:,.0f} bytes/entry")
```

**Solutions:**
- Decrease cache TTL to expire entries faster
- Clear cache manually: `client.clear_cache()`
- Implement cache size limits (future enhancement)

### Missing Request IDs

**Symptoms:** Logs don't have request_id field

**Diagnosis:**
```bash
# Check if logging is configured
grep -v request_id logs.json | head -5
```

**Solutions:**
- Ensure `setup_logging()` is called in `main()`
- Verify tools use `@monitored_tool` decorator
- Use `RequestContext` for manual logging

### Logs Not Appearing

**Symptoms:** No logs output or incomplete logs

**Diagnosis:**
```python
import logging
logging.getLogger().setLevel(logging.DEBUG)  # Temporarily increase verbosity
```

**Solutions:**
- Check `LOG_LEVEL` environment variable
- Verify stderr is not redirected (logs go to stderr)
- Check `LOG_FILE` path has write permissions
- Ensure `use_json=True` in `setup_logging()`

---

## Additional Resources

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guidelines
- [TESTING.md](TESTING.md) - Testing documentation
- [MCP Specification](https://modelcontextprotocol.io/) - Model Context Protocol docs

## Support

For issues or questions:
- GitHub Issues: [https://github.com/n8daniels/FedDocMCP/issues](https://github.com/n8daniels/FedDocMCP/issues)
- Discussions: [https://github.com/n8daniels/FedDocMCP/discussions](https://github.com/n8daniels/FedDocMCP/discussions)
