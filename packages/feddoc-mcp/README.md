# FedDocMCP

[![Tests](https://github.com/n8daniels/FedDocMCP/workflows/Tests/badge.svg)](https://github.com/n8daniels/FedDocMCP/actions)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-1.0-green.svg)](https://modelcontextprotocol.io/)

A Model Context Protocol (MCP) server that provides end users with direct access to Congressional bill data from Congress.gov, Federal Register regulations, and GovInfo.gov document collections.

## Overview

FedDocMCP enables end users to search, retrieve, and analyze U.S. Congressional bills, Federal Register regulations, Court opinions, Congressional hearings, and 39+ other government document collections in real-time through any MCP-compatible client. Built on the Model Context Protocol, this server provides a standardized interface for accessing official government APIs including Congress.gov, FederalRegister.gov, and GovInfo.gov.

### What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect to external data sources and tools. MCP servers expose capabilities that AI assistants can use to extend their functionality beyond their training data.

**Key concepts:**
- **Server**: Provides tools and resources (this project)
- **Client**: MCP-compatible application that uses the server (e.g., desktop clients, IDEs, AI assistants)
- **Transport**: Communication layer (stdio for local use)
- **Tools**: Functions the client can call (search bills, get bill text, etc.)

Learn more: [Model Context Protocol Specification](https://modelcontextprotocol.io/)

## Features

### Congressional Bills (Congress.gov)
- **Search Bills**: Find legislation by keyword, congress session, or bill type
- **Get Bill Text**: Retrieve full text of bills in multiple formats
- **Track Bill Status**: Follow a bill's progress through the legislative process

### Federal Register Regulations
- **Search Regulations**: Find rules, proposed rules, notices, and presidential documents
- **Get Regulation Details**: Retrieve full details of Federal Register documents with CFR references
- **Public Inspection**: Access documents filed but not yet published

### Government Documents (GovInfo.gov)
- **List Collections**: Browse 39+ available document collections
- **Search Collections**: Find documents in Congressional Record, hearings, court opinions, budget documents, and more
- **Get Package Details**: Retrieve complete metadata and download links for any government document

### Core Capabilities
- **Real-time Data**: Direct access to official government APIs
- **Privacy-First**: No data storage, all queries happen in real-time
- **Type-Safe**: Built with Pydantic for robust data validation
- **Date Filtering**: Filter by fiscal year or custom date ranges
- **Free**: All APIs used are free (Congress.gov and GovInfo require free API keys, Federal Register requires none)

## Quick Start

### Prerequisites

- Python 3.10 or higher
- Congress.gov API key ([get one free here](https://api.congress.gov/sign-up/)) - Required
- GovInfo.gov API key ([get one free here](https://api.data.gov/signup/)) - Optional, for GovInfo tools
- An MCP-compatible client application

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/n8daniels/FedDocMCP.git
   cd FedDocMCP
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure API key**
   ```bash
   cp .env.example .env
   # Edit .env and add your Congress.gov API key
   ```

4. **Test the server**
   ```bash
   python src/server.py
   ```

### MCP Client Configuration

To use FedDocMCP with an MCP-compatible client, add it to your client's configuration file.

**Example configuration** (adapt to your specific MCP client):

```json
{
  "mcpServers": {
    "feddocmcp": {
      "command": "python",
      "args": ["/absolute/path/to/FedDocMCP/src/server.py"],
      "env": {
        "CONGRESS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Notes:**
- Replace `/absolute/path/to/FedDocMCP/src/server.py` with the actual path on your system
- Add your Congress.gov API key to the `CONGRESS_API_KEY` field
- Restart your MCP client after updating the configuration
- See `examples/mcp_client_config.json` for reference

## Available Tools

### 1. search_bills

Search for congressional bills by keyword, congress session, or type.

**Parameters:**
- `query` (required): Search keywords or phrases
- `congress`: Congress number (e.g., 118 for 118th Congress)
- `bill_type`: Type of bill (hr, s, hjres, sjres, etc.)
- `limit`: Maximum results (1-100, default: 20)

**Example:**
```
Search for bills about "climate change" in the 118th Congress
```

### 2. get_bill_text

Retrieve the full text of a specific bill.

**Parameters:**
- `congress` (required): Congress number
- `bill_type` (required): Type of bill
- `bill_number` (required): Bill number
- `format`: Text format (json, xml, pdf)

**Example:**
```
Get the text of H.R. 1 from the 118th Congress
```

### 3. get_bill_status

Track a bill's progress through the legislative process.

**Parameters:**
- `congress` (required): Congress number
- `bill_type` (required): Type of bill
- `bill_number` (required): Bill number

**Example:**
```
What's the status of S. 234 from the 118th Congress?
```

### 4. search_regulations

Search the Federal Register for regulations, rules, notices, and presidential documents.

**Parameters:**
- `query` (required): Search keywords or phrases
- `document_type`: Type of document (rule, prorule, notice, presdocu)
- `agency`: Filter by agency (e.g., "EPA", "FDA")
- `limit`: Maximum results (1-100, default: 20)
- `fiscal_year`: Filter by fiscal year
- `start_date` / `end_date`: Filter by custom date range

**Example:**
```
Search for EPA environmental regulations from fiscal year 2024
```

### 5. get_regulation_details

Retrieve full details of a specific Federal Register document.

**Parameters:**
- `document_number` (required): Federal Register document number (e.g., "2024-12345")

**Example:**
```
Get details for Federal Register document 2024-12345
```

### 6. get_public_inspection_documents

Access documents filed with the Federal Register but not yet published.

**Parameters:**
- `agency`: Filter by agency (optional)
- `special_filing`: Show only special filings (optional)

**Example:**
```
Show me EPA documents on public inspection
```

### 7. list_govinfo_collections

List all available GovInfo.gov document collections.

**Parameters:**
- None required

**Example:**
```
What collections are available on GovInfo?
Show me all government document types
```

**Returns:**
- List of 39+ collections including Congressional Bills, Federal Register, CFR, Court Opinions, Congressional Record, Budget documents, and more

### 8. search_govinfo_collection

Search for documents in a specific GovInfo collection by date range.

**Parameters:**
- `collection_code` (required): Collection code (e.g., "BILLS", "FR", "CHRG", "CREC")
- `start_date`: Start date in ISO format (YYYY-MM-DD)
- `end_date`: End date in ISO format (YYYY-MM-DD)
- `limit`: Maximum results (1-100, default: 20)

**Example:**
```
Search Congressional Record for documents from January 2024
Find all Congressional hearings from last month
Get Public Laws from fiscal year 2024
```

### 9. get_govinfo_package

Get detailed information about a specific GovInfo document package.

**Parameters:**
- `package_id` (required): Package identifier (e.g., "BILLS-118hr1", "FR-2024-12345")

**Example:**
```
Get details for package BILLS-118hr1
Show me Congressional hearing CHRG-118shrg52367
```

### 10. get_server_health

Monitor server performance and health metrics.

**Parameters:**
- None required

**Example:**
```
Check server health
Show me performance metrics
```

**Returns:**
- Overall health status (✅ HEALTHY, ⚠️ warnings, or ❌ errors)
- Cache hit rate and statistics
- Average response time
- API call statistics by API
- Tool usage breakdown
- Error counts and rates

## API Key Setup

### Congress.gov API (Required for Bill Tools)

1. Visit [Congress.gov API Sign Up](https://api.congress.gov/sign-up/)
2. Fill out the form with your email
3. Check your email for the API key
4. Add it to your `.env` file or MCP client config

**Rate Limits:**
- 5,000 requests per hour per API key
- FedDocMCP includes automatic rate limiting and retry logic

### Federal Register API (No Key Required)

The Federal Register tools do **NOT** require an API key - they work out of the box!

### GovInfo.gov API (Optional for GovInfo Tools)

1. Visit [api.data.gov Sign Up](https://api.data.gov/signup/)
2. Enter your email address
3. Check your email for the API key
4. Add `GOVINFO_API_KEY` to your `.env` file or MCP client config

**Rate Limits:**
- 1,000 requests per hour (default free tier)
- FedDocMCP includes automatic rate limiting and retry logic

**Note:** GovInfo tools will not work without an API key. If you don't need access to Congressional Record, hearings, court opinions, or other GovInfo collections, you can skip this step.

See [docs/API_KEYS.md](docs/API_KEYS.md) for detailed instructions.

## Usage Examples

### Example 1: Research Recent Legislation

"Search for bills about artificial intelligence introduced in the 118th Congress"

### Example 2: Read Specific Bill

"Show me the full text of H.R. 1 from the 118th Congress"

### Example 3: Track Progress

"What's the current status of the Infrastructure Investment and Jobs Act?"

### Example 4: Search by Fiscal Year

"Find all climate change bills introduced in fiscal year 2024"

Federal fiscal years run from October 1 to September 30. FY 2024 = Oct 1, 2023 to Sep 30, 2024.

### Example 5: Search with Date Range

"Search for infrastructure bills introduced between January 1, 2023 and June 30, 2023"

### Example 6: Compare Bills

"Search for all bills about student loans and summarize their key differences"

### Example 7: Search Federal Regulations

"Find EPA regulations about clean water from fiscal year 2024"

### Example 8: Track Proposed Rules

"Show me proposed rules from the FDA"

### Example 9: Monitor Public Inspection

"What documents are currently on public inspection from the Department of Transportation?"

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for development setup and guidelines.

### Running Tests

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html
```

### Code Quality

```bash
# Format code
black src/ tests/

# Lint
flake8 src/ tests/

# Type check
mypy src/
```

### Logging Configuration

FedDocMCP includes structured JSON logging for debugging and monitoring.

**Environment Variables:**
- `LOG_LEVEL`: Set logging verbosity (DEBUG, INFO, WARNING, ERROR, CRITICAL) - default: INFO
- `LOG_FORMAT`: Choose output format (json, text) - default: json
- `LOG_FILE`: Optional file path for logging output - default: stderr only

**Examples:**

```bash
# Debug mode with text formatting
LOG_LEVEL=DEBUG LOG_FORMAT=text python src/server.py

# Production logging to file
LOG_LEVEL=INFO LOG_FILE=/var/log/feddocmcp.log python src/server.py
```

**JSON Log Format:**
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

**Features:**
- **Request ID Tracking**: Each tool call gets a unique request ID for correlation across logs
- **Structured Fields**: Consistent JSON format for easy parsing and analysis
- **Performance Metrics**: Automatic duration tracking for all tool calls
- **Error Context**: Detailed exception information with stack traces
- **Custom Context**: Add arbitrary fields to logs using the `extra` parameter

See `src/utils/logging.py` for implementation details and advanced usage.

## Project Structure

```
FedDocMCP/
├── src/
│   ├── __init__.py
│   ├── server.py                    # Main MCP server
│   ├── config.py                    # Configuration management
│   ├── monitoring.py                # Performance monitoring
│   ├── tools/                       # Tool implementations
│   │   ├── __init__.py
│   │   ├── bills.py                 # Congressional bill tools
│   │   ├── federal_register.py     # Federal Register tools
│   │   └── system.py                # System health tools
│   ├── clients/                     # API clients
│   │   ├── __init__.py
│   │   ├── congress_api.py          # Congress.gov API client
│   │   └── federal_register_api.py  # Federal Register API client
│   └── utils/                       # Shared utilities
│       ├── __init__.py
│       ├── cache.py                 # Enhanced cache with metadata
│       ├── dates.py                 # Date parsing and validation
│       ├── logging.py               # Structured JSON logging
│       └── validation.py            # Input validation with hints
├── tests/                           # Test suite (216 tests, 82% coverage)
├── docs/                            # Documentation
├── examples/                        # Usage examples
├── requirements.txt                 # Dependencies
└── pyproject.toml                  # Project metadata
```

## Architecture

FedDocMCP is built as a stateless MCP server that:

1. **Receives requests** from MCP clients via stdio transport
2. **Validates inputs** using Pydantic schemas
3. **Calls Congress.gov API** with proper authentication and rate limiting
4. **Formats responses** as structured JSON
5. **Returns results** to the client

No data is stored locally - all information comes directly from Congress.gov.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- Report bugs and issues
- Suggest new features or tools
- Improve documentation
- Submit pull requests
- Share how you're using FedDocMCP

## Roadmap

### v0.1.0 (Current)
- [x] Basic bill search
- [x] Bill text retrieval
- [x] Bill status tracking
- [x] Congress.gov API integration

### v0.2.0 (Planned)
- [ ] Member information tools
- [ ] Committee data
- [ ] Voting records
- [ ] Amendment tracking

### v0.3.0 (Future)
- [ ] Congressional Record search
- [ ] Hearing information
- [ ] Treaty data
- [ ] Nomination tracking

### v1.0.0 (Vision)
- [ ] Full Congress.gov API coverage
- [ ] Advanced caching
- [ ] WebSocket support
- [ ] Multi-source data (GovInfo, etc.)

## Projects Using FedDocMCP

Are you using FedDocMCP in your project? Let us know! Open an issue or PR to add your project here.

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

**Common Issues:**
- **API key not working**: Verify it's correctly set in `.env` or config
- **Server not starting**: Check Python version (3.10+) and dependencies
- **No tools showing in MCP client**: Restart your MCP client after config changes
- **Rate limit errors**: Wait an hour or use a different API key

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io/)
- Data provided by [Congress.gov API](https://api.congress.gov/)
- MCP Python SDK by [Anthropic](https://github.com/modelcontextprotocol/python-sdk)

## Support

- Issues: [GitHub Issues](https://github.com/n8daniels/FedDocMCP/issues)
- Discussions: [GitHub Discussions](https://github.com/n8daniels/FedDocMCP/discussions)
- MCP Documentation: [modelcontextprotocol.io](https://modelcontextprotocol.io/)

## Security

Please report security vulnerabilities to security@example.com (do not open public issues).

See [SECURITY.md](docs/SECURITY.md) for our security policy.

---

Made with ❤️ for transparent, accessible democracy
