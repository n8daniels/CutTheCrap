# FedDocMCP Architecture

This document describes the technical architecture of FedDocMCP.

## Overview

FedDocMCP is a **Model Context Protocol (MCP) server** that provides AI assistants with access to Congressional bill data from Congress.gov. It acts as a bridge between MCP clients (like Claude Desktop) and the Congress.gov API.

```
┌─────────────────┐
│  Claude Desktop │
│   (MCP Client)  │
└────────┬────────┘
         │ MCP Protocol (stdio)
         │
┌────────▼────────┐
│   FedDocMCP     │
│  (MCP Server)   │
└────────┬────────┘
         │ HTTPS
         │
┌────────▼────────┐
│  Congress.gov   │
│      API        │
└─────────────────┘
```

## Components

### 1. MCP Server (`src/server.py`)

**Responsibilities:**
- Initialize MCP server with stdio transport
- Handle tool registration and discovery
- Route tool calls to appropriate handlers
- Manage server lifecycle
- Handle errors and logging

**Key Functions:**

```python
async def main():
    """Main entry point for the MCP server."""
    # Initialize server
    server = Server("feddocmcp")

    # Register capabilities
    @server.list_tools()
    async def list_tools():
        return [TOOL_SCHEMAS...]

    # Handle tool calls
    @server.call_tool()
    async def call_tool(name: str, arguments: dict):
        return await route_to_handler(name, arguments)

    # Start server with stdio transport
    async with stdio_server() as streams:
        await server.run(*streams)
```

**Transport:**
- Uses **stdio** (standard input/output) for communication
- Messages are JSON-RPC format
- Client sends tool requests, server responds with results

### 2. Configuration (`src/config.py`)

**Responsibilities:**
- Load environment variables
- Validate configuration
- Provide configuration to other components
- Set up logging

**Configuration Sources:**
1. Environment variables (`.env` file)
2. System environment variables
3. Default values

```python
class Config:
    """Application configuration."""

    def __init__(self):
        load_dotenv()
        self.congress_api_key = os.getenv("CONGRESS_API_KEY")
        self.api_base_url = os.getenv(
            "CONGRESS_API_BASE_URL",
            "https://api.congress.gov/v3"
        )
        self.log_level = os.getenv("LOG_LEVEL", "INFO")

        self.validate()

    def validate(self):
        """Validate configuration."""
        if not self.congress_api_key:
            raise ValueError("CONGRESS_API_KEY is required")
```

### 3. Tools (`src/tools/bills.py`)

**Responsibilities:**
- Define tool schemas (what tools are available)
- Implement tool handlers (what tools do)
- Validate tool inputs
- Format tool outputs

**Tool Structure:**

Each tool has:
1. **Schema**: Defines the tool's interface
2. **Handler**: Implements the tool's logic
3. **Validator**: Validates inputs (using Pydantic)
4. **Formatter**: Formats outputs for the client

**Example Tool:**

```python
# Schema
SEARCH_BILLS_SCHEMA = {
    "name": "search_bills",
    "description": "Search for congressional bills",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "limit": {"type": "integer", "minimum": 1, "maximum": 100}
        },
        "required": ["query"]
    }
}

# Handler
async def search_bills_handler(arguments: dict) -> dict:
    """Handle search_bills tool calls."""
    # Validate inputs
    query = arguments["query"]
    limit = arguments.get("limit", 20)

    # Call API
    client = CongressAPIClient()
    results = client.search_bills(query=query, limit=limit)

    # Format output
    return {
        "results": results,
        "count": len(results)
    }
```

### 4. API Client (`src/clients/congress_api.py`)

**Responsibilities:**
- Make HTTP requests to Congress.gov API
- Handle authentication (API key)
- Implement rate limiting
- Retry failed requests
- Parse and return structured data

**Key Features:**

**Authentication:**
```python
def _get_headers(self) -> dict:
    """Get request headers with API key."""
    return {
        "X-Api-Key": self.api_key,
        "Accept": "application/json"
    }
```

**Rate Limiting:**
```python
class RateLimiter:
    """Rate limiter for API requests."""

    def __init__(self, max_requests: int = 5000, window: int = 3600):
        self.max_requests = max_requests  # 5000 per hour
        self.window = window  # 1 hour
        self.requests = []

    async def acquire(self):
        """Wait if rate limit exceeded."""
        now = time.time()
        # Remove old requests outside window
        self.requests = [r for r in self.requests if now - r < self.window]

        if len(self.requests) >= self.max_requests:
            wait_time = self.window - (now - self.requests[0])
            await asyncio.sleep(wait_time)

        self.requests.append(now)
```

**Retry Logic:**
```python
async def _make_request(self, endpoint: str, params: dict = None):
    """Make API request with retry logic."""
    max_retries = 3
    backoff = 1  # seconds

    for attempt in range(max_retries):
        try:
            await self.rate_limiter.acquire()
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(backoff * (2 ** attempt))
            else:
                raise APIError(f"Request failed: {e}")
```

## Data Flow

### Tool Call Flow

1. **Client Request**
   ```
   Client → MCP Server: call_tool("search_bills", {"query": "climate"})
   ```

2. **Server Processing**
   ```python
   server.call_tool() receives request
   ↓
   Routes to search_bills_handler()
   ↓
   Validates arguments
   ↓
   Creates CongressAPIClient
   ↓
   Calls client.search_bills()
   ```

3. **API Request**
   ```python
   CongressAPIClient.search_bills()
   ↓
   Checks rate limit
   ↓
   Makes HTTP request to Congress.gov
   ↓
   Parses JSON response
   ↓
   Returns structured data
   ```

4. **Server Response**
   ```python
   Handler formats results
   ↓
   Returns to server.call_tool()
   ↓
   Server sends response to client
   ```

5. **Client Display**
   ```
   Client receives formatted results
   ↓
   Displays to user
   ```

## MCP Protocol

### Protocol Basics

MCP uses **JSON-RPC 2.0** over stdio:

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_bills",
    "arguments": {
      "query": "climate change",
      "limit": 10
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 10 bills about climate change..."
      }
    ]
  }
}
```

### Server Capabilities

FedDocMCP exposes these capabilities:

1. **Tools** (tools/list, tools/call)
   - List available tools
   - Execute tool calls

2. **Resources** (optional, future)
   - Provide cached or static data

3. **Prompts** (optional, future)
   - Provide prompt templates

## Error Handling

### Error Types

1. **Validation Errors**
   - Invalid tool parameters
   - Missing required fields
   - Out-of-range values

2. **API Errors**
   - Invalid API key
   - Rate limit exceeded
   - Network errors
   - API endpoint errors

3. **Server Errors**
   - Internal server errors
   - Unexpected exceptions

### Error Flow

```python
try:
    # Validate inputs
    validate_arguments(arguments)

    # Make API call
    results = await api_client.search_bills(...)

    # Format results
    return format_results(results)

except ValidationError as e:
    logger.error(f"Validation error: {e}")
    return error_response("Invalid parameters", details=str(e))

except APIError as e:
    logger.error(f"API error: {e}")
    return error_response("API request failed", details=str(e))

except Exception as e:
    logger.exception("Unexpected error")
    return error_response("Internal server error")
```

## Security

### API Key Management

- **Never** hardcode API keys
- Load from environment variables
- Never log API keys
- Don't include in error messages

### Input Validation

- Validate all tool inputs
- Use Pydantic for type safety
- Sanitize user inputs
- Limit input sizes

### Rate Limiting

- Respect Congress.gov rate limits
- Implement exponential backoff
- Track request counts
- Prevent abuse

## Performance

### Async/Await

Use async for I/O-bound operations:

```python
# Good: Concurrent requests
async def get_multiple_bills(bill_ids):
    tasks = [get_bill(bid) for bid in bill_ids]
    return await asyncio.gather(*tasks)

# Bad: Sequential requests
async def get_multiple_bills_slow(bill_ids):
    results = []
    for bid in bill_ids:
        result = await get_bill(bid)  # Waits for each
        results.append(result)
    return results
```

### Caching (Future)

Planned for v0.2:

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_bill_cached(congress: int, bill_type: str, number: int):
    """Cache bill data."""
    return api_client.get_bill(congress, bill_type, number)
```

## Testing Architecture

### Test Layers

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test API interactions
3. **End-to-End Tests**: Test full MCP flow

### Mocking

Mock external dependencies:

```python
from unittest.mock import Mock, patch

def test_search_bills():
    """Test bill search with mocked API."""
    with patch('src.clients.congress_api.requests.get') as mock_get:
        mock_get.return_value.json.return_value = {
            "bills": [{"title": "Test Bill"}]
        }

        results = search_bills(query="test")
        assert len(results) == 1
```

## Deployment

### Local Development

```bash
python src/server.py
```

### Claude Desktop

Runs as a subprocess managed by Claude Desktop.

### Future: Docker

Planned for v1.0:

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY src/ ./src/
CMD ["python", "src/server.py"]
```

## Logging

### Log Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARNING**: Warning messages
- **ERROR**: Error messages
- **CRITICAL**: Critical errors

### Log Format

```python
logging.basicConfig(
    level=config.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### What to Log

```python
# Log tool calls
logger.info(f"Tool called: {tool_name} with args: {arguments}")

# Log API requests
logger.debug(f"API request: GET {url}")

# Log errors
logger.error(f"API error: {error_message}")

# Don't log sensitive data
logger.info("Authentication successful")  # Good
logger.info(f"API key: {api_key}")  # BAD!
```

## Future Enhancements

### v0.2.0
- Member information tools
- Committee data
- Voting records
- Caching layer

### v0.3.0
- Congressional Record search
- Hearing information
- Advanced filtering

### v1.0.0
- Full Congress.gov API coverage
- WebSocket support
- Docker deployment
- Prometheus metrics

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [Congress.gov API](https://api.congress.gov/)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
- [Pydantic](https://docs.pydantic.dev/)

---

For implementation details, see the source code in `src/`.
