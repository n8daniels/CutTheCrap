# Contributing to FedDocMCP

Thank you for your interest in contributing to FedDocMCP! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and harassment-free environment for everyone. Be kind, professional, and constructive in all interactions.

## Important: Client-Agnostic Language

**CRITICAL: FedDocMCP is a general-purpose MCP server, not a client-specific tool.**

When contributing code, documentation, or examples:

- ✅ **DO**: Refer to "end users", "MCP clients", or "MCP-compatible applications"
- ✅ **DO**: Use "your MCP client" when giving instructions
- ✅ **DO**: Provide examples that work with any MCP client
- ❌ **DON'T**: Refer to specific AI assistants or MCP clients by name
- ❌ **DON'T**: Say "FedDocMCP sends data to [Client]"
- ❌ **DON'T**: Write client-specific documentation unless absolutely necessary

**Why this matters:**
- FedDocMCP provides data to **end users** through MCP clients
- Any MCP-compatible client can use this server
- Client-specific references limit the perceived usability of the project

**Correct phrasing:**
- "FedDocMCP provides end users with access to Congressional data"
- "Use FedDocMCP with any MCP-compatible client"
- "Configure your MCP client to use FedDocMCP"

**Incorrect phrasing:**
- ~~"FedDocMCP sends data to Claude"~~ → "FedDocMCP provides data to end users"
- ~~"For Claude Desktop users"~~ → "For MCP client users"
- ~~"Claude can search bills"~~ → "End users can search bills through their MCP client"

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Git
- A Congress.gov API key (free from https://api.congress.gov/sign-up/)
- Familiarity with the Model Context Protocol (https://modelcontextprotocol.io/)

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/FedDocMCP.git
   cd FedDocMCP
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

4. **Set up your environment**
   ```bash
   cp .env.example .env
   # Add your API key to .env
   ```

5. **Run tests to verify setup**
   ```bash
   pytest
   ```

## Development Workflow

### Branch Naming

- Feature branches: `feature/description-of-feature`
- Bug fixes: `fix/description-of-bug`
- Documentation: `docs/description-of-change`
- Refactoring: `refactor/description-of-refactor`

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow PEP 8 style guidelines
   - Add docstrings to functions and classes
   - Include type hints

3. **Write tests**
   - Add unit tests for new functionality
   - Ensure existing tests still pass
   - Aim for >80% code coverage

4. **Run code quality checks**
   ```bash
   # Format code
   black src/ tests/

   # Lint
   flake8 src/ tests/

   # Type check
   mypy src/

   # Run tests
   pytest --cov=src
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add descriptive commit message"
   ```

   Use conventional commit format:
   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation changes
   - `test:` Test additions or changes
   - `refactor:` Code refactoring
   - `chore:` Maintenance tasks

6. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### Python Style

- Follow PEP 8
- Use Black for code formatting (line length: 88)
- Use type hints for function parameters and return values
- Write descriptive docstrings (Google or NumPy style)

### Example Function

```python
from typing import Optional, List, Dict, Any

def search_bills(
    query: str,
    congress: Optional[int] = None,
    bill_type: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Search for congressional bills by keyword.

    Args:
        query: Search keywords or phrases
        congress: Congress number (e.g., 118)
        bill_type: Type of bill (hr, s, hjres, etc.)
        limit: Maximum number of results (1-100)

    Returns:
        List of bill dictionaries containing metadata

    Raises:
        ValueError: If limit is out of range
        APIError: If API request fails
    """
    # Implementation here
    pass
```

### Testing

- Write unit tests for all new functions
- Use pytest fixtures for common setups
- Mock external API calls in tests
- Test edge cases and error conditions

### Example Test

```python
import pytest
from src.tools.bills import search_bills

def test_search_bills_basic():
    """Test basic bill search functionality."""
    results = search_bills(query="climate change", limit=5)
    assert len(results) <= 5
    assert all("title" in bill for bill in results)

def test_search_bills_invalid_limit():
    """Test that invalid limit raises ValueError."""
    with pytest.raises(ValueError):
        search_bills(query="test", limit=101)
```

## Adding New Tools

To add a new MCP tool:

1. **Define the tool schema** in `src/tools/`
   ```python
   TOOL_NAME_SCHEMA = {
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

2. **Implement the handler function**
   ```python
   async def tool_name_handler(arguments: dict) -> str:
       """Handle tool_name requests."""
       # Implementation
       return result
   ```

3. **Register the tool** in `src/server.py`
   ```python
   @server.list_tools()
   async def list_tools():
       return [TOOL_NAME_SCHEMA, ...]

   @server.call_tool()
   async def call_tool(name: str, arguments: dict):
       if name == "tool_name":
           return await tool_name_handler(arguments)
   ```

4. **Add tests** in `tests/test_tools.py`

5. **Update documentation** in README.md

## Adding New API Endpoints

To integrate a new Congress.gov API endpoint:

1. **Research the endpoint** at https://api.congress.gov/
2. **Add method to `CongressAPIClient`** in `src/clients/congress_api.py`
3. **Implement error handling and rate limiting**
4. **Add unit tests**
5. **Document the new functionality**

## Documentation

- Update README.md for user-facing changes
- Update docs/ for detailed documentation
- Add inline comments for complex logic
- Update CHANGELOG.md for releases

## Pull Request Process

1. **Ensure your PR**:
   - Has a clear, descriptive title
   - Includes a detailed description of changes
   - References any related issues (#123)
   - Passes all tests and quality checks
   - Updates relevant documentation
   - Adds new tests for new functionality

2. **PR Template** (automatically loaded):
   - What does this PR do?
   - What issue does it fix?
   - How has it been tested?
   - Screenshots (if applicable)
   - Checklist of completed items

3. **Review Process**:
   - Maintainers will review your PR
   - Address feedback and comments
   - Make requested changes
   - Once approved, a maintainer will merge

## Reporting Bugs

Use the GitHub issue tracker. Include:

- Clear, descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Python version)
- Relevant logs or error messages

Use the bug report template provided.

## Suggesting Features

Open a GitHub issue with:

- Clear description of the feature
- Use case and motivation
- Example usage
- Potential implementation approach

Use the feature request template provided.

## Project Structure

```
FedDocMCP/
├── src/
│   ├── server.py          # Main MCP server
│   ├── config.py          # Configuration
│   ├── tools/             # Tool implementations
│   └── clients/           # API clients
├── tests/                 # Test suite
├── docs/                  # Documentation
└── examples/              # Usage examples
```

## Questions?

- Open a GitHub Discussion
- Check existing issues and PRs
- Read the MCP documentation: https://modelcontextprotocol.io/

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to FedDocMCP and supporting open, accessible democracy!
