# Testing FedDocMCP

This guide covers six different methods for testing the FedDocMCP server, from quick validation to comprehensive integration testing.

## Testing Methods Overview

1. **MCP Inspector** - Interactive UI for testing tools and schemas
2. **MCP Client** - Test with Claude Desktop or other MCP clients
3. **Direct Server Test** - Quick command-line validation
4. **Unit Tests** - Automated test suite with pytest
5. **Custom Python Client** - Programmatic testing and integration
6. **Integration Testing** - End-to-end workflow validation

---

## Method 1: MCP Inspector

The MCP Inspector provides an interactive web UI for testing your MCP server.

### Setup

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Or use npx (no installation required)
npx @modelcontextprotocol/inspector
```

### Running

```bash
# Set your API key
export CONGRESS_API_KEY=your_api_key_here

# Start the inspector
npx @modelcontextprotocol/inspector python -m src.server

# Or if using uvx
npx @modelcontextprotocol/inspector uvx feddocmcp
```

### What to Test

1. **Tool Discovery**
   - Verify all 3 tools appear: `search_bills`, `get_bill_text`, `get_bill_status`
   - Check that schemas are complete and correct

2. **search_bills Tool**
   ```json
   {
     "query": "climate change",
     "limit": 5
   }
   ```
   - Test with fiscal_year: `{"query": "infrastructure", "fiscal_year": 2024}`
   - Test with date range: `{"query": "AI", "start_date": "2023-01-01", "end_date": "2023-12-31"}`
   - Test with congress filter: `{"query": "healthcare", "congress": 118}`

3. **get_bill_text Tool**
   ```json
   {
     "congress": 118,
     "bill_type": "hr",
     "bill_number": 1
   }
   ```

4. **get_bill_status Tool**
   ```json
   {
     "congress": 118,
     "bill_type": "s",
     "bill_number": 1
   }
   ```

### Troubleshooting

- **Server won't start**: Check that `CONGRESS_API_KEY` is set
- **No tools appear**: Verify Python path and module installation
- **API errors**: Confirm API key is valid at https://api.congress.gov

---

## Method 2: MCP Client (Claude Desktop)

Test with Claude Desktop or any MCP-compatible client.

### Configuration

1. **Locate your MCP client config file**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add FedDocMCP configuration**:
   ```json
   {
     "mcpServers": {
       "feddocmcp": {
         "command": "python",
         "args": ["-m", "src.server"],
         "cwd": "/absolute/path/to/FedDocMCP",
         "env": {
           "CONGRESS_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

3. **Restart your MCP client**

### Test Queries

Try these natural language queries:

1. **Bill Search**
   - "Search for bills about climate change introduced in 2024"
   - "Find all infrastructure bills from fiscal year 2023"
   - "Show me AI-related bills from the 118th Congress"

2. **Bill Text**
   - "Get the text of H.R. 1 from the 118th Congress"
   - "Show me the full text of Senate bill 100"

3. **Bill Status**
   - "What's the status of H.R. 1234 from the 118th Congress?"
   - "Track the progress of S. 567"

### Verification

- Tools should appear in the client's tool palette
- Queries should return formatted bill information
- Date filtering should work correctly
- Error messages should be helpful

---

## Method 3: Direct Server Test

Quick command-line test to verify the server runs.

### Run Server

```bash
# Set API key
export CONGRESS_API_KEY=your_api_key_here

# Run server
python -m src.server
```

### Expected Output

The server should start without errors and log:
```
INFO: FedDocMCP server initialized
INFO: Starting FedDocMCP server...
INFO: Server running with stdio transport
```

### Quick Validation

Press `Ctrl+D` or `Ctrl+C` to stop. If it starts and stops cleanly, basic initialization works.

---

## Method 4: Unit Tests

Comprehensive automated test suite using pytest.

### Running Tests

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=src --cov-report=term-missing

# Run specific test file
pytest tests/test_bills.py -v

# Run specific test
pytest tests/test_bills.py::TestSearchBillsHandler::test_search_bills_success -v
```

### Test Categories

1. **Unit Tests** (`test_bills.py`, `test_congress_api.py`, `test_dates.py`, `test_config.py`)
   - Test individual functions and classes
   - All API calls are mocked
   - Fast execution

2. **Integration Tests** (`test_integration.py`)
   - Test end-to-end workflows
   - Test tool handlers with mocked API
   - Test server initialization

3. **Server Tests** (`test_server.py`)
   - Test MCP server initialization
   - Test tool registration
   - Test error handling

### Coverage Goals

- **Target**: >80% code coverage
- **Current**: 75% overall
- Run `pytest --cov=src --cov-report=html` for detailed report

### Writing New Tests

```python
import pytest
from unittest.mock import AsyncMock, patch
from src.tools.bills import search_bills_handler

@pytest.mark.asyncio
@patch('src.tools.bills.CongressAPIClient')
async def test_my_feature(mock_client_class):
    """Test description."""
    # Setup mock
    mock_client = AsyncMock()
    mock_client.search_bills.return_value = [...]
    mock_client_class.return_value = mock_client

    # Test
    result = await search_bills_handler({"query": "test"})

    # Assert
    assert result[0]["type"] == "text"
```

---

## Method 5: Custom Python Client

Use FedDocMCP programmatically in your own Python code.

### Example Client

```python
import asyncio
from src.clients.congress_api import CongressAPIClient

async def main():
    """Example custom client."""
    async with CongressAPIClient() as client:
        # Search for bills
        bills = await client.search_bills(
            query="climate change",
            fiscal_year=2024,
            limit=10
        )

        for bill in bills:
            print(f"{bill['type']} {bill['number']}: {bill['title']}")

        # Get bill details
        if bills:
            first_bill = bills[0]
            details = await client.get_bill_details(
                congress=first_bill['congress'],
                bill_type=first_bill['type'],
                bill_number=first_bill['number']
            )
            print(f"\nSponsor: {details['sponsor']['name']}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Use Cases

- Building your own applications on top of FedDocMCP
- Custom data processing pipelines
- Integration with other systems
- Automated bill tracking

### Available API Methods

```python
# CongressAPIClient methods
await client.search_bills(query, congress=None, bill_type=None,
                         fiscal_year=None, start_date=None, end_date=None,
                         limit=20, offset=0)

await client.get_bill_details(congress, bill_type, bill_number)

await client.get_bill_text(congress, bill_type, bill_number, format="json")

await client.get_bill_status(congress, bill_type, bill_number)
```

---

## Method 6: Integration Testing

End-to-end testing with real API calls.

### Setup

```bash
# Set a valid API key
export CONGRESS_API_KEY=your_real_api_key_here

# Mark tests as integration tests
pytest tests/test_integration.py -m integration -v
```

### Integration Test Example

```python
import pytest
from src.clients.congress_api import CongressAPIClient

@pytest.mark.integration
@pytest.mark.asyncio
async def test_real_api_call():
    """Test with real API (requires valid key)."""
    async with CongressAPIClient() as client:
        bills = await client.search_bills(
            query="infrastructure",
            limit=5
        )

        assert len(bills) > 0
        assert bills[0]['title']
        assert bills[0]['type']
```

### Integration Test Checklist

- [ ] Server starts successfully
- [ ] All tools are registered
- [ ] search_bills returns real data
- [ ] get_bill_text retrieves actual bill text
- [ ] get_bill_status shows real action history
- [ ] Date filtering works correctly
- [ ] Error handling works (invalid bill numbers, etc.)
- [ ] Rate limiting respects API limits
- [ ] Retry logic works on failures

### Rate Limit Considerations

- Congress.gov API limit: **5000 requests/hour**
- Integration tests count toward this limit
- Use sparingly or with a dedicated test API key
- Consider caching responses for repeated tests

---

## Quick Reference Commands

```bash
# Install dependencies
pip install -r requirements-dev.txt

# Run all unit tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run specific tests
pytest tests/test_bills.py -v
pytest tests/test_integration.py -k "search" -v

# Code quality checks
black src/ tests/          # Format code
flake8 src/ tests/         # Lint code
mypy src/                  # Type check

# Start server for manual testing
export CONGRESS_API_KEY=your_key
python -m src.server

# MCP Inspector
npx @modelcontextprotocol/inspector python -m src.server
```

---

## Continuous Integration

Tests run automatically on GitHub Actions:

```yaml
# .github/workflows/tests.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: pip install -r requirements-dev.txt
      - run: pytest tests/ --cov=src
```

View test results at: `https://github.com/yourusername/FedDocMCP/actions`

---

## Troubleshooting Tests

### Common Issues

1. **Import errors**
   ```bash
   # Install in editable mode
   pip install -e .
   ```

2. **API key errors in tests**
   ```bash
   # Tests use mock API key automatically
   # Check conftest.py for fixtures
   ```

3. **Async test failures**
   ```python
   # Always mark async tests
   @pytest.mark.asyncio
   async def test_something():
       ...
   ```

4. **Coverage too low**
   ```bash
   # View detailed report
   pytest --cov=src --cov-report=html
   open htmlcov/index.html
   ```

---

## Best Practices

1. **Write tests first** (TDD)
2. **Mock external API calls** in unit tests
3. **Use integration tests sparingly** (rate limits)
4. **Aim for >80% coverage**
5. **Test error cases**, not just happy paths
6. **Keep tests fast** (<2 seconds for unit tests)
7. **Use descriptive test names**
8. **Document complex test setups**

---

## Next Steps

- See [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
