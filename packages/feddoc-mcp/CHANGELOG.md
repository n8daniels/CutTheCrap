# Changelog

All notable changes to FedDocMCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Member information tools
- Committee data access
- Voting records
- Amendment tracking
- Congressional Record search
- Regulations.gov API integration (public comments, dockets)
- WebSocket support
- Persistent caching layer (Redis/SQLite)

## [0.3.0] - 2025-11-18

### Added
- **GovInfo.gov API Integration**
  - GovInfoClient for accessing GovInfo.gov API (FREE API key required from api.data.gov)
  - Three new MCP tools:
    - `list_govinfo_collections`: List all 39+ available government document collections
    - `search_govinfo_collection`: Search specific collections by date range
    - `get_govinfo_package`: Retrieve complete package metadata and download links
  - Support for all GovInfo collections including:
    - Congressional Record (CREC)
    - Congressional Hearings (CHRG)
    - U.S. Court Opinions (USCOURTS)
    - Code of Federal Regulations (CFR)
    - Public Laws (PLAW)
    - Budget Documents (BUDGET)
    - Compilation of Presidential Documents (CPD)
    - And 33+ more government document collections
  - Optional GOVINFO_API_KEY configuration
  - Rate limiting (1000 requests/hour default)
  - Full async/await support with caching and retry logic
  - 22 new tests (GovInfoClient: 69% coverage, tools: 81% coverage)

### Technical Details
- GovInfo client follows same architecture as Federal Register integration
- Automatic rate limiting and exponential backoff retry logic
- Request deduplication for concurrent requests
- Response caching with configurable TTL
- Comprehensive error handling with helpful messages

### Documentation
- Updated README with GovInfo tools and setup instructions
- Added GOVINFO_API_KEY to .env.example
- Updated configuration documentation

### Research Notes
- Investigated military publication APIs (Army, Navy, Air Force, etc.)
- Confirmed military publications require CAC (Common Access Card) authentication
- No public APIs available for DoD/military branch publications
- GovInfo.gov provides best alternative for publicly accessible government documents

## [Unreleased - Post v0.3.0]

### Added
- **Performance Monitoring & Health Checks**
  - Automatic tracking of cache hits/misses, response times, API calls, and errors
  - `get_server_health` MCP tool to expose real-time performance metrics
  - Health status indicators (✅ HEALTHY, ⚠️ warnings, ❌ errors)
  - Monitored decorator automatically wraps all tool handlers
  - 28 new monitoring tests

- **Structured JSON Logging**
  - JSON-formatted logs with consistent fields (timestamp, level, message, request_id, source)
  - Request ID tracking for correlating logs across async operations
  - Automatic request ID generation and context management
  - Environment variable configuration:
    - `LOG_LEVEL`: Set verbosity (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    - `LOG_FORMAT`: Choose format (json, text)
    - `LOG_FILE`: Optional file path for logging output
  - Integration with performance monitoring for detailed tool call tracking
  - 17 new logging tests

- **Analytics & Telemetry System**
  - Real-time usage analytics with two backend options:
    - Firebase backend with official JavaScript SDK
    - GitHub-based backend (100% free alternative using GitHub as database)
  - Privacy-first design: only anonymous aggregates, no user identities or search queries
  - Metrics collected: cache hit rates, response times, tool usage, API calls, error rates
  - Automated reporting scheduler with configurable intervals
  - Web-based dashboards for both Firebase and GitHub backends
  - Comprehensive setup documentation (ANALYTICS_SETUP.md)
  - New telemetry utilities:
    - `telemetry.py`: Firebase telemetry client
    - `telemetry_github.py`: GitHub-based telemetry client
    - `telemetry_scheduler.py`: Periodic reporting scheduler

- **Enhanced Cache Metadata**
  - CacheEntry dataclass with timestamp, access tracking, and versioning
  - Per-entry metadata: created_at, last_accessed, access_count, age, size
  - CacheStats class tracking hits, misses, expirations, evictions, and total size
  - Automatic cache statistics in both API clients (Congress.gov and Federal Register)
  - get_cache_stats() method providing detailed cache insights:
    - Hit rate and total requests
    - Average and maximum entry age
    - Average and maximum access count per entry
    - Total cache size in bytes
  - Enhanced logging with cache metadata (size, version, age, access_count)
  - 23 new cache tests, 100% coverage for cache utilities

- **Enhanced Input Validation**
  - ValidationError class with detailed context (field, value, message, hint, valid_values)
  - Validator class with comprehensive validation methods:
    - required() - Check required fields with custom hints
    - string_not_empty() - Validate non-empty strings
    - integer_range() - Range validation with min/max
    - one_of() - Enum-style validation with case-insensitive option
    - pattern() - Regex pattern matching with descriptions
    - mutually_exclusive() - Ensure only one field provided
    - requires() - Conditional field requirements
    - custom() - Custom validation functions
  - Input sanitization utilities:
    - sanitize_string() - Trim whitespace and limit length
    - normalize_case() - Case normalization (lower, upper, title)
    - coerce_to_int() - Safe integer coercion with defaults
  - Clear, actionable error messages with hints for fixing issues
  - 53 new validation tests, 99% coverage for validation utilities
  - **Total: 216 tests, 82% coverage**

### Documentation
- **docs/MONITORING.md** - Comprehensive monitoring and observability guide:
  - Performance monitoring architecture and metrics
  - Cache statistics and optimization strategies
  - Structured logging configuration and analysis
  - Health check system with examples
  - Integration examples and best practices
  - Troubleshooting guide for common issues

### Technical Improvements
- Performance monitoring integrated into both API clients (Congress.gov and Federal Register)
- Cache hit/miss tracking for optimization insights
- Enhanced cache with metadata tracking (age, access count, size, version)
- Per-cache-entry statistics for identifying hot/cold data
- Automatic cache size tracking and memory usage monitoring
- Cache expiration with custom TTL support per entry
- Response time tracking with rolling window (last 1000 requests)
- Tool usage statistics and error rate monitoring
- Health check tool provides actionable performance insights
- All tool calls automatically logged with request ID, duration, status, and cache hit/miss
- Python `ContextVar` used for async-safe request ID tracking
- Structured logging enables easy parsing for log aggregation tools
- Comprehensive input validation with detailed error messages and hints
- Reusable validation utilities for consistent error handling across tools
- Sanitization and type coercion utilities for robust input processing

## [0.2.0] - 2025-11-15

### Added
- **Federal Register Integration**
  - FederalRegisterClient for accessing Federal Register API (FREE, no API key required)
  - Three new MCP tools:
    - `search_regulations`: Search Federal Register for regulations, rules, notices, and presidential documents
    - `get_regulation_details`: Retrieve full details of specific Federal Register documents
    - `get_public_inspection_documents`: Access documents filed but not yet published
  - Support for all Federal Register document types: rules, proposed rules, notices, presidential documents
  - Date filtering via fiscal year or custom date ranges (same as bill tools)
  - CFR (Code of Federal Regulations) reference extraction
  - Direct links to HTML, PDF, and XML versions of documents

### Technical Details
- 28 new tests added (95 total tests, 78% coverage)
- Async/await patterns consistent with bill tools
- Same caching, rate limiting, and retry logic as Congressional bills
- Full type hints with mypy strict mode
- Flake8 and Black code quality standards maintained

## [0.1.0] - 2025-11-15

### Added
- **Core MCP Server**
  - Model Context Protocol (MCP) server implementation with stdio transport
  - Congress.gov API integration with full error handling
  - Three production-ready tools:
    - `search_bills`: Search for congressional bills by keyword, congress, or type
    - `get_bill_text`: Retrieve full text of specific bills
    - `get_bill_status`: Track bill status and action history

- **Date Filtering Support**
  - Fiscal year filtering (converts FY to Oct 1 - Sep 30 date range)
  - Custom start_date/end_date parameters with ISO format (YYYY-MM-DD)
  - Default 2-year lookback window
  - 10-year maximum range validation
  - Mutual exclusivity validation for date parameters

- **Performance Optimizations**
  - Response caching with configurable TTL (default: 5 minutes)
  - Request deduplication to prevent duplicate concurrent API calls
  - In-memory cache for frequently accessed bill data
  - Rate limiting (5000 requests/hour) with sliding window algorithm
  - Retry logic with exponential backoff

- **Documentation**
  - Complete testing guide (TESTING.md) with 6 testing methods
  - Security policy and best practices (SECURITY.md)
  - README with quick start and usage examples
  - SETUP guide for installation
  - API_KEYS guide for Congress.gov API
  - DEVELOPMENT guide for contributors
  - ARCHITECTURE documentation
  - TROUBLESHOOTING guide
  - CONTRIBUTING guidelines with client-agnostic language requirements

- **Development Tools**
  - Complete test suite (67 tests, 75% coverage)
  - Black code formatting
  - Flake8 linting
  - Mypy type checking
  - GitHub Actions CI/CD workflow
  - GitHub templates for issues and pull requests
  - Example code demonstrating usage
  - MCP client configuration support (client-agnostic)

### Technical Details
- Python 3.10+ required
- Async/await throughout for performance
- Full type hints with mypy strict mode
- Comprehensive input validation with Pydantic
- Proper error handling and logging
- Clean separation of concerns
- Async context managers for resource cleanup
- Thread-safe caching and deduplication

## [0.0.1] - 2025-11-15

### Added
- Project initialization
- Repository structure
- Basic documentation
- MIT License
- Development environment setup

---

## Version History

### Version 0.1.0 (Current)
**Release Date:** November 15, 2025

First functional release of FedDocMCP. Provides core functionality for searching
and retrieving Congressional bill data through the MCP protocol.

**Highlights:**
- Full MCP protocol implementation
- Three production-ready tools
- Comprehensive test coverage
- Production-ready error handling
- Complete documentation

**Known Limitations:**
- Bill text extraction returns URLs rather than full parsed text (requires additional parsing)
- Cache is in-memory only (not persisted across restarts)
- Limited to bill data (no member, committee, or voting data yet)
- No WebSocket transport support (stdio only)

**Next Steps:**
See roadmap in README.md for planned features in v0.2.0 and beyond.

---

[unreleased]: https://github.com/n8daniels/FedDocMCP/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/n8daniels/FedDocMCP/releases/tag/v0.3.0
[0.2.0]: https://github.com/n8daniels/FedDocMCP/releases/tag/v0.2.0
[0.1.0]: https://github.com/n8daniels/FedDocMCP/releases/tag/v0.1.0
[0.0.1]: https://github.com/n8daniels/FedDocMCP/releases/tag/v0.0.1
