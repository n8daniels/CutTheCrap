# Development Guide

This guide is for developers who want to contribute to FedDocMCP or understand its internals.

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/FedDocMCP.git
cd FedDocMCP
```

### 2. Set Up Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Add your Congress.gov API key to .env
```

### 4. Verify Setup

```bash
# Run tests
pytest

# Check formatting
black --check src/ tests/

# Run linter
flake8 src/ tests/

# Type check
mypy src/
```

## Project Structure

```
FedDocMCP/
├── src/                      # Source code
│   ├── __init__.py
│   ├── server.py            # Main MCP server
│   ├── config.py            # Configuration management
│   ├── tools/               # MCP tool implementations
│   │   ├── __init__.py
│   │   └── bills.py         # Bill-related tools
│   └── clients/             # External API clients
│       ├── __init__.py
│       └── congress_api.py  # Congress.gov API client
├── tests/                   # Test suite
│   ├── __init__.py
│   ├── test_server.py
│   ├── test_bills.py
│   └── test_congress_api.py
├── docs/                    # Documentation
├── examples/                # Usage examples
├── .github/                 # GitHub templates and workflows
├── requirements.txt         # Production dependencies
├── requirements-dev.txt     # Development dependencies
├── pyproject.toml          # Project configuration
└── .env.example            # Environment template
```

## Development Workflow

### Creating a Feature

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**
   ```bash
   pytest
   black src/ tests/
   flake8 src/ tests/
   mypy src/
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Then create a PR on GitHub
   ```

## Testing

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_bills.py

# Run specific test
pytest tests/test_bills.py::test_search_bills

# Run with coverage
pytest --cov=src --cov-report=html

# Run only fast tests
pytest -m "not slow"
```

### Writing Tests

#### Unit Test Example

```python
import pytest
from src.tools.bills import search_bills

def test_search_bills_basic():
    """Test basic bill search."""
    results = search_bills(query="climate", limit=5)
    assert isinstance(results, list)
    assert len(results) <= 5

def test_search_bills_invalid_limit():
    """Test validation of limit parameter."""
    with pytest.raises(ValueError):
        search_bills(query="test", limit=101)
```

#### Integration Test Example

```python
import pytest
from src.clients.congress_api import CongressAPIClient

@pytest.mark.integration
def test_congress_api_connection():
    """Test actual API connection."""
    client = CongressAPIClient()
    result = client.search_bills(query="infrastructure", limit=1)
    assert len(result) == 1
```

### Test Fixtures

```python
import pytest
from src.clients.congress_api import CongressAPIClient

@pytest.fixture
def api_client():
    """Create a test API client."""
    return CongressAPIClient(api_key="test_key")

def test_with_fixture(api_client):
    """Use the fixture in a test."""
    assert api_client is not None
```

## Code Quality

### Formatting with Black

```bash
# Check formatting
black --check src/ tests/

# Auto-format
black src/ tests/
```

**Configuration**: See `[tool.black]` in `pyproject.toml`

### Linting with Flake8

```bash
# Run linter
flake8 src/ tests/

# Check specific file
flake8 src/server.py
```

**Configuration**: See `[tool.flake8]` in `pyproject.toml`

### Type Checking with MyPy

```bash
# Type check all code
mypy src/

# Check specific file
mypy src/server.py
```

**Configuration**: See `[tool.mypy]` in `pyproject.toml`

### Pre-commit Checks

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
set -e

echo "Running pre-commit checks..."

# Format
black --check src/ tests/

# Lint
flake8 src/ tests/

# Type check
mypy src/

# Test
pytest

echo "All checks passed!"
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Adding New Features

### Adding a New Tool

1. **Define the schema** in `src/tools/bills.py`:

```python
NEW_TOOL_SCHEMA = {
    "name": "tool_name",
    "description": "What the tool does",
    "inputSchema": {
        "type": "object",
        "properties": {
            "param": {
                "type": "string",
                "description": "Parameter description"
            }
        },
        "required": ["param"]
    }
}
```

2. **Implement the handler**:

```python
async def tool_name_handler(arguments: dict) -> dict:
    """
    Handle tool_name requests.

    Args:
        arguments: Tool input parameters

    Returns:
        Tool result data

    Raises:
        ValueError: If parameters are invalid
    """
    # Validate inputs
    # Call API
    # Format results
    return result
```

3. **Register in server** (`src/server.py`):

```python
@server.list_tools()
async def list_tools():
    return [
        SEARCH_BILLS_SCHEMA,
        NEW_TOOL_SCHEMA,  # Add here
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "tool_name":
        return await tool_name_handler(arguments)
```

4. **Add tests**:

```python
def test_new_tool():
    """Test the new tool."""
    result = tool_name_handler({"param": "value"})
    assert result is not None
```

5. **Update documentation**:
   - Add to README.md
   - Add example usage
   - Update CHANGELOG.md

### Adding a New API Endpoint

1. **Research the endpoint** at https://api.congress.gov/

2. **Add method to `CongressAPIClient`**:

```python
class CongressAPIClient:
    def get_new_data(self, param: str) -> dict:
        """
        Fetch new data from Congress.gov.

        Args:
            param: Parameter description

        Returns:
            API response data

        Raises:
            APIError: If request fails
        """
        endpoint = f"/new-endpoint/{param}"
        return self._make_request(endpoint)
```

3. **Add tests**:

```python
def test_get_new_data(api_client):
    """Test new API method."""
    result = api_client.get_new_data("test")
    assert "data" in result
```

## Debugging

### Using Python Debugger

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use built-in breakpoint()
breakpoint()
```

### Using IPython

```bash
# Install ipdb (in requirements-dev.txt)
pip install ipdb

# Use in code
import ipdb; ipdb.set_trace()
```

### Logging

```python
import logging

logger = logging.getLogger(__name__)

def my_function():
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
    logger.error("Error message")
```

### Testing with MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run inspector
mcp-inspector python src/server.py
```

## Documentation

### Docstring Format

Use Google-style docstrings:

```python
def function_name(param1: str, param2: int) -> bool:
    """
    Short description of function.

    Longer description if needed. Explain what the function
    does, any important details, etc.

    Args:
        param1: Description of param1
        param2: Description of param2

    Returns:
        Description of return value

    Raises:
        ValueError: When this happens
        APIError: When that happens

    Examples:
        >>> function_name("test", 42)
        True
    """
    pass
```

### Updating Documentation

When making changes:

1. Update relevant `.md` files in `docs/`
2. Update README.md if user-facing
3. Add entry to CHANGELOG.md
4. Update docstrings in code
5. Update examples if needed

## Release Process

### Version Numbering

Follow Semantic Versioning (semver.org):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Creating a Release

1. **Update version** in `pyproject.toml`:
   ```toml
   version = "0.2.0"
   ```

2. **Update CHANGELOG.md**:
   ```markdown
   ## [0.2.0] - 2024-01-15
   ### Added
   - New feature X
   ### Changed
   - Improved Y
   ### Fixed
   - Bug Z
   ```

3. **Commit and tag**:
   ```bash
   git add .
   git commit -m "chore: Release v0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

4. **Create GitHub release**:
   - Go to GitHub Releases
   - Create new release from tag
   - Copy CHANGELOG entry
   - Publish release

## Performance Optimization

### Profiling

```python
import cProfile
import pstats

# Profile a function
cProfile.run('my_function()', 'profile_stats')

# Analyze results
stats = pstats.Stats('profile_stats')
stats.sort_stats('cumulative')
stats.print_stats(10)
```

### Async Best Practices

```python
import asyncio
from typing import List

# Good: Concurrent requests
async def fetch_multiple_bills(bill_ids: List[str]) -> List[dict]:
    tasks = [fetch_bill(bid) for bid in bill_ids]
    return await asyncio.gather(*tasks)

# Bad: Sequential requests
async def fetch_multiple_bills_slow(bill_ids: List[str]) -> List[dict]:
    results = []
    for bid in bill_ids:
        result = await fetch_bill(bid)  # Waits for each one
        results.append(result)
    return results
```

## Common Tasks

### Adding a Dependency

```bash
# Add to requirements.txt
echo "new-package>=1.0.0" >> requirements.txt

# Install
pip install -r requirements.txt

# Update pyproject.toml dependencies section
```

### Running a Single Test File

```bash
pytest tests/test_bills.py -v
```

### Checking Coverage

```bash
pytest --cov=src --cov-report=html
open htmlcov/index.html  # macOS
start htmlcov/index.html  # Windows
```

## Getting Help

- **Documentation**: Check other `.md` files in `docs/`
- **Issues**: Search GitHub issues
- **Discussions**: GitHub Discussions
- **MCP Docs**: https://modelcontextprotocol.io/

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for full contribution guidelines.

---

Happy coding! 🚀
