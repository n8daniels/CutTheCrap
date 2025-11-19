# FedDocMCP - Complete Task List

## Overview
Building a Python MCP (Model Context Protocol) server to provide access to US federal documentation, starting with Congressional bills from Congress.gov API.

**Important Notes:**
- This is an MCP SERVER, not an application - keep scope focused on exposing tools
- Follow MCP specification: https://modelcontextprotocol.io/specification/2025-06-18/architecture
- Use stdio transport (not HTTP for v0.1)
- No user data storage - privacy first
- API keys via environment variables only

---

## Phase 0: Repository Setup & Initialization

### Task 0.1: Initialize Git Repository
- [ ] Initialize git repo: `git init`
- [ ] Create `.gitignore` for Python projects
- [ ] Add standard Python `.gitignore` entries: venv/, __pycache__/, *.pyc, .env, dist/, *.egg-info/

### Task 0.2: Create Core Documentation Files
- [ ] Create `README.md` with:
  - Project description and purpose
  - MCP architecture explanation
  - Quick start guide
  - Installation instructions (pip install, API key setup)
  - Claude Desktop configuration example
  - Available tools documentation
  - Usage examples
  - Contributing guidelines
  - Roadmap
  - "Projects Using FedDocMCP" section
- [ ] Create `LICENSE` file (MIT License)
- [ ] Create `CONTRIBUTING.md` with contribution guidelines
- [ ] Create `.github/ISSUE_TEMPLATE/` directory
- [ ] Create bug report template in `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] Create feature request template in `.github/ISSUE_TEMPLATE/feature_request.md`
- [ ] Create `.github/PULL_REQUEST_TEMPLATE.md`

### Task 0.3: Project Configuration Files
- [ ] Create `requirements.txt` with core dependencies:
  - `mcp` (MCP Python SDK)
  - `requests` (for API calls)
  - `python-dotenv` (for environment variables)
  - `pydantic` (for data validation)
- [ ] Create `requirements-dev.txt` with development dependencies:
  - `pytest`
  - `pytest-cov`
  - `pytest-asyncio`
  - `black` (code formatting)
  - `flake8` (linting)
  - `mypy` (type checking)
- [ ] Create `pyproject.toml` for project metadata and tool configuration
- [ ] Create `.env.example` with template: `CONGRESS_API_KEY=your_api_key_here`

### Task 0.4: Documentation Structure
- [ ] Create `docs/` directory
- [ ] Create `docs/SETUP.md` - Detailed setup instructions
- [ ] Create `docs/API_KEYS.md` - How to get Congress.gov API key from https://api.congress.gov/sign-up/
- [ ] Create `docs/DEVELOPMENT.md` - Development workflow and guidelines
- [ ] Create `docs/ARCHITECTURE.md` - Technical architecture details
- [ ] Create `docs/TROUBLESHOOTING.md` - Common issues and solutions
- [ ] Create `docs/TESTING.md` - Comprehensive testing guide (all 6 testing methods)

### Task 0.5: Examples Directory
- [ ] Create `examples/` directory
- [ ] Create `examples/basic_usage.py` - Simple usage example
- [ ] Create `examples/claude_desktop_config.json` - Sample Claude Desktop config
- [ ] Create `examples/custom_client.py` - Example of using as library

---

## Phase 1: Project Setup & Foundation

### Task 1.1: Directory Structure
- [ ] Create project structure:
  ```
  src/
  ├── __init__.py
  ├── server.py          # Main MCP server
  ├── config.py          # Configuration management
  ├── tools/             # Tool implementations
  │   ├── __init__.py
  │   └── bills.py       # Bill-related tools
  ├── clients/           # API clients
  │   ├── __init__.py
  │   └── congress_api.py
  └── utils/             # Utility functions
      ├── __init__.py
      └── dates.py       # Date handling utilities
  ```
- [ ] Create `tests/` directory structure:
  ```
  tests/
  ├── __init__.py
  ├── test_server.py
  ├── test_bills.py
  ├── test_congress_api.py
  └── test_dates.py
  ```

### Task 1.2: Configuration Management
- [ ] Create `src/config.py` to handle:
  - Environment variable loading with python-dotenv
  - API key validation (check CONGRESS_API_KEY exists)
  - Configuration defaults
  - Logging setup
- [ ] Implement `Config` class with Pydantic validation
- [ ] Add helpful error messages for missing API keys
- [ ] Add default configuration values:
  - `default_date_range_days = 730` (2 years)
  - `max_date_range_days = 3650` (10 years)
  - `default_limit = 20`
  - `max_limit = 100`

### Task 1.3: Date Utility Functions
- [ ] Create `src/utils/dates.py` with helper functions:
  - `fiscal_year_to_dates(fy: int) -> tuple[date, date]` - Convert FY to Oct 1 - Sep 30 dates
  - `congress_to_dates(congress: int) -> tuple[date, date]` - Convert congress number to date range
  - `validate_date_range(start: str | None, end: str | None) -> tuple[date | None, date | None]` - Parse and validate ISO date strings
  - `get_current_fiscal_year() -> int` - Calculate current FY based on today's date
  - `get_default_start_date() -> date` - Return date 2 years ago
- [ ] Add comprehensive docstrings to all functions
- [ ] Add error handling for invalid dates
- [ ] Add validation that start_date < end_date

### Task 1.4: Congress.gov API Client Foundation
- [ ] Research Congress.gov API documentation at https://api.congress.gov/
- [ ] Document available endpoints in code comments:
  - Bill search endpoint
  - Bill details endpoint
  - Bill text endpoint
  - Bill actions endpoint
- [ ] Create `src/clients/congress_api.py`
- [ ] Implement `CongressAPIClient` class with:
  - `__init__(api_key: str)` - Initialize with API key
  - Base URL: `https://api.congress.gov/v3/`
  - Request headers with API key
  - Rate limiting logic (5000 requests/hour)
  - Retry logic with exponential backoff (3 retries)
  - Comprehensive error handling
  - Request/response logging to stderr
- [ ] Add type hints to all methods

### Task 1.5: Basic MCP Server Implementation
- [ ] Create `src/server.py` with MCP server skeleton
- [ ] Import MCP SDK: `from mcp.server import Server`
- [ ] Import stdio transport: `from mcp.server.stdio import stdio_server`
- [ ] Initialize server with:
  - Name: "feddoc-mcp"
  - Version: "0.1.0"
- [ ] Set up stdio transport
- [ ] Implement initialization handler
- [ ] Declare server capabilities (tools support)
- [ ] Add structured logging (use stderr, not stdout)
- [ ] Implement graceful shutdown handler
- [ ] Add `if __name__ == "__main__"` entry point with asyncio.run()

---

## Phase 2: Implement Bill Search Tools

### Task 2.1: Congress.gov API Client - Search Bills
- [ ] Implement `search_bills()` method in `CongressAPIClient`:
  - Parameters: `query: str, congress: int | None = None, fiscal_year: int | None = None, start_date: str | None = None, end_date: str | None = None, limit: int = 20`
  - Build API URL: `/bill?query={query}`
  - Add query parameters based on what's provided
  - If fiscal_year provided: convert to fromDateTime/toDateTime
  - If start_date/end_date provided: use as fromDateTime/toDateTime
  - If congress provided: add congress parameter
  - If nothing provided: default to last 2 years
  - Handle pagination if needed
  - Parse JSON response
  - Return list of bill dictionaries with: bill_number, title, sponsor, status, introduced_date
- [ ] Add input validation using Pydantic
- [ ] Handle API errors gracefully (404, 401, 429, 500)
- [ ] Add custom exception class for API errors
- [ ] Add unit tests for `search_bills()` with mocked requests

### Task 2.2: Congress.gov API Client - Get Bill Details
- [ ] Implement `get_bill_details()` method:
  - Parameters: `congress: int, bill_type: str, bill_number: int`
  - Build URL: `/bill/{congress}/{bill_type}/{bill_number}`
  - Fetch bill metadata from API
  - Parse response with type checking
  - Return structured dict with: title, sponsor, cosponsors, committees, summary, introduced_date, latest_action
- [ ] Add optional in-memory caching (simple dict) for frequently accessed bills
- [ ] Add unit tests with mocked responses

### Task 2.3: Congress.gov API Client - Get Bill Text
- [ ] Implement `get_bill_text()` method:
  - Parameters: `congress: int, bill_type: str, bill_number: int, format: str = 'json'`
  - Support formats: json, xml, pdf
  - Build URL: `/bill/{congress}/{bill_type}/{bill_number}/text`
  - Handle large text responses (may need chunking)
  - Return dict with: bill_number, title, text, format, retrieved_date
- [ ] Add text truncation if response > 50KB (with indicator)
- [ ] Add unit tests

### Task 2.4: MCP Tool - search_bills
- [ ] Create `src/tools/bills.py`
- [ ] Define tool schema using MCP SDK format:
  ```python
  {
    "name": "search_bills",
    "description": "Search for congressional bills by keyword, congress session, or fiscal year. Returns bill metadata including number, title, sponsor, and status.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search keywords or phrases"
        },
        "congress": {
          "type": "integer",
          "description": "Congress number (e.g., 118 for 118th Congress, 2023-2025)"
        },
        "fiscal_year": {
          "type": "integer",
          "description": "Federal fiscal year (e.g., 2024 for FY2024, Oct 2023 - Sep 2024)",
          "minimum": 2000,
          "maximum": 2030
        },
        "start_date": {
          "type": "string",
          "description": "Start date filter (ISO format: YYYY-MM-DD)"
        },
        "end_date": {
          "type": "string",
          "description": "End date filter (ISO format: YYYY-MM-DD)"
        },
        "limit": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100,
          "description": "Maximum number of results"
        }
      },
      "required": ["query"]
    }
  }
  ```
- [ ] Implement `handle_search_bills()` handler function
- [ ] Call CongressAPIClient.search_bills() with parameters
- [ ] Format results as structured JSON array
- [ ] Include metadata: total_count, returned_count, date_range_used
- [ ] Add comprehensive error handling with helpful messages
- [ ] Register tool with MCP server in server.py

### Task 2.5: MCP Tool - get_bill_text
- [ ] Define tool schema for `get_bill_text`:
  - Parameters: congress (required), bill_type (required), bill_number (required), format (optional)
  - Description: "Retrieve the full text of a specific bill"
- [ ] Implement `handle_get_bill_text()` handler
- [ ] Handle multiple format options (json/xml/pdf)
- [ ] Return formatted bill text with metadata
- [ ] Include: title, sponsor, introduction date, full text
- [ ] Add error handling for bill not found
- [ ] Register with MCP server

### Task 2.6: MCP Tool - get_bill_status
- [ ] Define tool schema for `get_bill_status`:
  - Parameters: congress (required), bill_type (required), bill_number (required)
  - Description: "Get the current status and action history of a bill"
- [ ] Implement `handle_get_bill_status()` handler to fetch action history
- [ ] Format actions chronologically (most recent first)
- [ ] Include: current status, all actions with dates, committees assigned, votes taken, amendments
- [ ] Add timeline-style formatting
- [ ] Register with MCP server

### Task 2.7: Tool Registration & Routing
- [ ] Export all tools from `src/tools/__init__.py`
- [ ] In `src/server.py`, import all tools
- [ ] Register all tools with server using `@server.list_tools()`
- [ ] Implement tool call routing with `@server.call_tool()`
- [ ] Add logging for each tool call (tool name, parameters)
- [ ] Handle tool errors gracefully and return helpful error messages
- [ ] Test that all tools are registered and callable

---

## Phase 3: Testing & Quality Assurance

### Task 3.1: Unit Tests
- [ ] Create `tests/test_congress_api.py`:
  - Test API authentication with valid/invalid keys
  - Test search_bills with various parameter combinations
  - Test get_bill_details with valid bill
  - Test get_bill_text with different formats
  - Test error handling (404, 401, 429)
  - Test rate limiting logic
  - Mock all API calls using pytest fixtures
- [ ] Create `tests/test_bills.py`:
  - Test tool schema validation
  - Test handler functions with mocked API client
  - Test error responses
  - Test date parameter handling
- [ ] Create `tests/test_dates.py`:
  - Test fiscal_year_to_dates() for various years
  - Test validate_date_range() with valid/invalid dates
  - Test get_current_fiscal_year()
  - Test edge cases (leap years, invalid dates)
- [ ] Run pytest and achieve >80% code coverage

### Task 3.2: Integration Tests
- [ ] Create `tests/test_integration.py`
- [ ] Test complete MCP server initialization
- [ ] Test tool registration (verify all tools listed)
- [ ] Test capability negotiation
- [ ] Test stdio transport communication
- [ ] Test with actual API calls using test API key (mark as integration tests)
- [ ] Test error scenarios (bad API key, invalid bill number, network errors)

### Task 3.3: Manual Testing with Claude Desktop
- [ ] Set CONGRESS_API_KEY in environment
- [ ] Run server: `python src/server.py`
- [ ] Configure Claude Desktop with server path
- [ ] Restart Claude Desktop
- [ ] Test search_bills with various queries:
  - "search for bills about climate change"
  - "find infrastructure bills from FY2024"
  - "search bills from 118th Congress about AI"
- [ ] Test get_bill_text for different bills
- [ ] Test get_bill_status tracking
- [ ] Test error handling (invalid bill number, bad parameters)
- [ ] Document any issues found in GitHub issues
- [ ] Fix discovered bugs

### Task 3.4: MCP Inspector Testing
- [ ] Install MCP Inspector: `npm install -g @modelcontextprotocol/inspector`
- [ ] Run: `mcp-inspector python src/server.py`
- [ ] Verify all 3 tools appear in inspector UI
- [ ] Test search_bills with various parameter combinations
- [ ] Test get_bill_text with different formats
- [ ] Test get_bill_status
- [ ] Verify JSON schemas are correct and complete
- [ ] Check that error messages are helpful and clear
- [ ] Test parameter validation (required fields, min/max values)

---

## Phase 4: Documentation & Polish

### Task 4.1: Code Documentation
- [ ] Add comprehensive docstrings to all classes using Google docstring format
- [ ] Add docstrings to all functions with:
  - Description
  - Args section with types
  - Returns section with type
  - Raises section for exceptions
  - Example usage where helpful
- [ ] Add type hints throughout entire codebase
- [ ] Add inline comments for complex logic
- [ ] Ensure all public APIs are documented

### Task 4.2: User Documentation
- [ ] Complete README.md with all sections:
  - Clear project description
  - Feature list (current and planned)
  - Prerequisites (Python 3.10+, API key)
  - Installation steps
  - Claude Desktop configuration with exact paths
  - Usage examples with real queries
  - Tool documentation (all 3 tools)
  - Date filtering examples (FY, congress, custom dates)
  - Troubleshooting section
  - FAQ
- [ ] Add screenshots or examples where helpful
- [ ] Update all code examples to be copy-pasteable

### Task 4.3: Developer Documentation
- [ ] Complete CONTRIBUTING.md with:
  - How to set up development environment
  - How to run tests
  - Code style guidelines (black, flake8)
  - How to add new tools
  - PR process
- [ ] Complete docs/DEVELOPMENT.md:
  - Project architecture overview
  - How MCP protocol works
  - How to debug the server
  - Development workflow
- [ ] Complete docs/ARCHITECTURE.md:
  - System architecture diagram (ASCII or link to image)
  - Component descriptions
  - Data flow
  - API client design
  - Tool implementation pattern

### Task 4.4: Testing Documentation
- [ ] Complete docs/TESTING.md with all 6 testing methods:
  - Method 1: MCP Inspector (with setup and examples)
  - Method 2: Claude Desktop (with config and test queries)
  - Method 3: Direct Server Test (quick validation)
  - Method 4: Unit Tests (pytest commands)
  - Method 5: Custom Python Client (code example)
  - Method 6: CutTheCrap Integration (how to use from your app)
- [ ] Add troubleshooting section for each method
- [ ] Add quick reference command list
- [ ] Include example test cases for each tool

### Task 4.5: Example Code
- [ ] Create working `examples/basic_usage.py`:
  - Import MCP client
  - Connect to server
  - Call search_bills
  - Print results
  - Add comments explaining each step
- [ ] Create `examples/claude_desktop_config.json` with actual example
- [ ] Test that all examples run successfully
- [ ] Add README in examples/ directory explaining each example

---

## Phase 5: CI/CD & Production Readiness

### Task 5.1: GitHub Actions
- [ ] Create `.github/workflows/test.yml`:
  - Trigger on push and pull_request
  - Set up Python 3.10, 3.11, 3.12
  - Install dependencies from requirements-dev.txt
  - Run pytest with coverage
  - Run black --check
  - Run flake8
  - Run mypy
  - Upload coverage to codecov (optional)
- [ ] Create `.github/workflows/release.yml`:
  - Trigger on tag push (v*.*.*)
  - Build package
  - Create GitHub release
  - (Future: publish to PyPI)
- [ ] Test that workflows run successfully

### Task 5.2: Code Quality
- [ ] Run `black .` to format all code
- [ ] Run `flake8 src/ tests/` and fix all linting issues
- [ ] Run `mypy src/` and fix all type errors
- [ ] Configure black, flake8, mypy in pyproject.toml
- [ ] Add pre-commit hooks configuration (optional: use pre-commit framework)

### Task 5.3: Performance & Optimization
- [ ] Implement response caching in CongressAPIClient (LRU cache or simple dict with TTL)
- [ ] Add request deduplication (don't make duplicate API calls within 1 minute)
- [ ] Optimize API call patterns (batch requests if possible)
- [ ] Add configurable timeout handling (default 30 seconds)
- [ ] Profile slow functions and optimize if needed
- [ ] Add max date range validation (prevent 10+ year queries)

### Task 5.4: Security Review
- [ ] Verify .gitignore includes .env, *.pyc, __pycache__, venv/
- [ ] Ensure no API keys hardcoded anywhere in code
- [ ] Check that all API keys come from environment variables only
- [ ] Review error messages to ensure no sensitive info leaked
- [ ] Add security section to README with best practices
- [ ] Verify .env.example doesn't contain real keys
- [ ] Add dependency security scanning (optional: use dependabot)

---

## Phase 6: Release Preparation

### Task 6.1: Version 0.1.0 Release
- [ ] Update version number in `pyproject.toml` to "0.1.0"
- [ ] Create `CHANGELOG.md` with v0.1.0 features:
  - Initial release
  - Congressional bills search
  - Bill text retrieval
  - Bill status tracking
  - Date filtering (FY, congress, custom dates)
- [ ] Test entire workflow end-to-end
- [ ] Create git tag: `git tag v0.1.0`
- [ ] Push tag: `git push origin v0.1.0`
- [ ] Create GitHub release with release notes
- [ ] Attach any release artifacts if applicable

### Task 6.2: Community Files
- [ ] Create `CODE_OF_CONDUCT.md` (use Contributor Covenant)
- [ ] Verify issue templates are working
- [ ] Verify PR template is working
- [ ] Set up GitHub Discussions (enable in repo settings)
- [ ] Add project description in GitHub repo settings
- [ ] Add topics/tags: mcp, model-context-protocol, congress, federal-data, civic-tech, python
- [ ] Add repository description and website URL
- [ ] Pin important issues or discussions

### Task 6.3: Final Documentation Review
- [ ] Proofread README.md for typos and clarity
- [ ] Verify all links work (API docs, examples, etc.)
- [ ] Ensure all code examples are correct and tested
- [ ] Check that installation instructions work on fresh system
- [ ] Verify Claude Desktop configuration example is accurate
- [ ] Add "Star this repo" call-to-action if appropriate

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All files properly structured
- ✅ MCP server can start without errors
- ✅ Can connect to Congress.gov API successfully
- ✅ Basic logging works and outputs to stderr

### Phase 2 Complete When:
- ✅ All 3 tools work correctly (search_bills, get_bill_text, get_bill_status)
- ✅ Can search and retrieve real bills from API
- ✅ Date filtering works (FY, congress, custom dates)
- ✅ Tools tested with MCP Inspector successfully
- ✅ Error handling is comprehensive and helpful

### Phase 3 Complete When:
- ✅ All tests pass (unit and integration)
- ✅ Code coverage >80%
- ✅ Works with Claude Desktop (tested with real queries)
- ✅ MCP Inspector shows all tools correctly
- ✅ No critical bugs found in testing

### v0.1.0 Ready When:
- ✅ All tests pass on CI/CD
- ✅ Documentation is complete and accurate
- ✅ README has clear installation instructions that work
- ✅ Examples work out of the box
- ✅ Code is formatted and linted
- ✅ Security review complete
- ✅ Ready for public use

---

## Future Phases (Post v0.1.0)

### Phase 7: Additional Federal Sources (v0.2.0)
- [ ] Add Federal Register API integration
- [ ] Add Regulations.gov API integration
- [ ] Add search_regulations tool
- [ ] Add get_regulation_text tool

### Phase 8: Military Documentation (v0.3.0)
- [ ] Research military publication APIs (Army, Navy, USAF, USMC, USCG, USSF)
- [ ] Add search_military_pubs tool with branch parameter
- [ ] Add get_military_pub tool
- [ ] Support all 6 military branches

### Phase 9: Additional Sources (v0.4.0+)
- [ ] GAO reports
- [ ] Congressional Research Service reports
- [ ] Executive orders
- [ ] Supreme Court decisions

---

## Notes for Development

**Critical Reminders:**
- This is an MCP SERVER, not an application - keep scope focused
- Follow MCP specification strictly: https://modelcontextprotocol.io/specification/2025-06-18/architecture
- Use stdio transport (not HTTP for v0.1)
- No user data storage - privacy first
- API keys via environment variables only
- Keep dependencies minimal
- Write tests as you build
- Document as you code

**Reference Materials:**
- MCP Spec: https://modelcontextprotocol.io/specification/2025-06-18/architecture
- MCP Python SDK: https://github.com/modelcontextprotocol/python-sdk
- Congress.gov API: https://api.congress.gov/
- API Key Signup: https://api.congress.gov/sign-up/

**Default Date Behavior:**
- If no date filter provided → last 2 years
- If fiscal_year provided → Oct 1 (FY-1) to Sep 30 (FY)
- If congress provided → Jan 3 of start year to Jan 3 two years later
- If start_date/end_date provided → use those exactly
- Maximum date range → 10 years (enforced)

**Tool Design Philosophy:**
- Keep tool schemas simple and clear
- Provide helpful descriptions for Claude
- Include examples in descriptions
- Make required fields minimal
- Provide sensible defaults
- Return structured JSON always
- Include metadata in responses (count, date range, etc.)

---

## End of Task List

Total Estimated Tasks: ~120
Estimated Time: 40-60 hours for v0.1.0
Target: Single developer, iterative development
Architecture: Python MCP server for federal documentation access
