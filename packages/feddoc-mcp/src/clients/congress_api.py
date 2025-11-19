"""
Congress.gov API client.

Handles all interactions with the Congress.gov API including authentication,
rate limiting, retry logic, and error handling.
"""

import time
import logging
import asyncio
from typing import Dict, List, Optional, Any, cast

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from ..config import get_config
from ..utils.dates import parse_date_parameters
from ..utils.cache import CacheEntry, CacheStats
from ..monitoring import get_monitor


logger = logging.getLogger(__name__)


class APIError(Exception):
    """Raised when API request fails."""

    pass


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""

    pass


class RateLimiter:
    """
    Rate limiter for API requests.

    Implements a sliding window rate limiter to respect Congress.gov API limits.
    """

    def __init__(self, max_requests: int = 5000, window_seconds: int = 3600) -> None:
        """
        Initialize rate limiter.

        Args:
            max_requests: Maximum requests allowed in window (default: 5000)
            window_seconds: Time window in seconds (default: 3600 = 1 hour)
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: List[float] = []
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        """
        Acquire permission to make a request.

        Waits if rate limit would be exceeded.

        Raises:
            RateLimitError: If rate limit is exceeded and wait time is too long
        """
        async with self._lock:
            now = time.time()

            # Remove requests outside the window
            cutoff = now - self.window_seconds
            self.requests = [req for req in self.requests if req > cutoff]

            # Check if we're at the limit
            if len(self.requests) >= self.max_requests:
                # Calculate wait time
                oldest_request = self.requests[0]
                wait_time = self.window_seconds - (now - oldest_request)

                if wait_time > 0:
                    logger.warning(
                        f"Rate limit reached. Waiting {wait_time:.2f} seconds..."
                    )
                    await asyncio.sleep(wait_time)

                    # Remove old requests again after waiting
                    now = time.time()
                    cutoff = now - self.window_seconds
                    self.requests = [req for req in self.requests if req > cutoff]

            # Record this request
            self.requests.append(now)

    def get_remaining(self) -> int:
        """
        Get number of remaining requests in current window.

        Returns:
            Number of requests remaining
        """
        now = time.time()
        cutoff = now - self.window_seconds
        recent = [req for req in self.requests if req > cutoff]
        return max(0, self.max_requests - len(recent))


class CongressAPIClient:
    """
    Client for Congress.gov API.

    Provides methods for searching bills, getting bill details, and accessing
    other Congressional data.
    """

    def __init__(self, api_key: Optional[str] = None, cache_ttl: int = 300) -> None:
        """
        Initialize API client.

        Args:
            api_key: Congress.gov API key (if None, loads from config)
            cache_ttl: Cache time-to-live in seconds (default: 300 = 5 minutes)
        """
        self.config = get_config()
        self.api_key = api_key or self.config.congress_api_key
        self.base_url = self.config.api_base_url
        self.cache_ttl = cache_ttl

        # Set up rate limiter
        self.rate_limiter = RateLimiter(
            max_requests=self.config.rate_limit,
            window_seconds=self.config.rate_limit_window,
        )

        # Set up session with retry logic
        self.session = self._create_session()

        # Response cache: {cache_key: CacheEntry}
        self._cache: Dict[str, CacheEntry] = {}
        self._cache_stats = CacheStats()

        # Pending requests: {cache_key: asyncio.Event} for deduplication
        self._pending: Dict[str, asyncio.Event] = {}
        self._pending_lock = asyncio.Lock()

        logger.info(f"Initialized CongressAPIClient with base URL: {self.base_url}")

    def _create_session(self) -> requests.Session:
        """
        Create requests session with retry logic.

        Returns:
            Configured requests session
        """
        session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=3,  # Total number of retries
            backoff_factor=1,  # Wait 1, 2, 4 seconds between retries
            status_forcelist=[429, 500, 502, 503, 504],  # Retry on these status codes
            allowed_methods=["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def _get_headers(self) -> Dict[str, str]:
        """
        Get request headers.

        Returns:
            Dictionary of headers
        """
        if not self.api_key:
            raise APIError("API key is not configured")

        return {
            "X-Api-Key": self.api_key,
            "Accept": "application/json",
            "User-Agent": "FedDocMCP/0.1.0",
        }

    def _make_cache_key(
        self, endpoint: str, params: Optional[Dict[str, Any]], method: str = "GET"
    ) -> str:
        """
        Generate cache key from request parameters.

        Args:
            endpoint: API endpoint
            params: Query parameters
            method: HTTP method

        Returns:
            Cache key string
        """
        # Sort params for consistent keys
        params_str = ""
        if params:
            sorted_params = sorted(params.items())
            params_str = str(sorted_params)
        return f"{method}:{endpoint}:{params_str}"

    def _get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Get response from cache if not expired.

        Args:
            cache_key: Cache key

        Returns:
            Cached response or None if not found/expired
        """
        if cache_key not in self._cache:
            self._cache_stats.record_miss()
            return None

        entry = self._cache[cache_key]

        if entry.is_expired(self.cache_ttl):
            # Expired - remove from cache
            self._cache_stats.record_expiration()
            self._cache_stats.update_size(-entry.size)
            del self._cache[cache_key]
            logger.debug(
                f"Cache expired for {cache_key}",
                extra={"age": entry.age, "access_count": entry.access_count},
            )
            return None

        # Mark as accessed and record hit
        entry.mark_accessed()
        self._cache_stats.record_hit()

        logger.debug(
            f"Cache hit for {cache_key}",
            extra={
                "age": entry.age,
                "access_count": entry.access_count,
                "time_since_access": entry.time_since_access,
            },
        )
        return entry.data

    def _put_in_cache(self, cache_key: str, response: Dict[str, Any]) -> None:
        """
        Store response in cache.

        Args:
            cache_key: Cache key
            response: Response to cache
        """
        entry = CacheEntry(data=response, version="1", ttl=self.cache_ttl)
        self._cache[cache_key] = entry
        self._cache_stats.update_size(entry.size)

        logger.debug(
            f"Cached response for {cache_key}",
            extra={"size_bytes": entry.size, "version": entry.version},
        )

    def clear_cache(self) -> None:
        """Clear the response cache."""
        self._cache.clear()
        self._cache_stats.reset()
        logger.info("Cache cleared")

    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache statistics including hit rate, size, and entry metadata
        """
        stats = self._cache_stats.to_dict()
        stats["entries"] = len(self._cache)

        # Add per-entry statistics
        if self._cache:
            ages = [entry.age for entry in self._cache.values()]
            access_counts = [entry.access_count for entry in self._cache.values()]

            stats["avg_entry_age"] = sum(ages) / len(ages)
            stats["max_entry_age"] = max(ages)
            stats["avg_access_count"] = sum(access_counts) / len(access_counts)
            stats["max_access_count"] = max(access_counts)
        else:
            stats["avg_entry_age"] = 0
            stats["max_entry_age"] = 0
            stats["avg_access_count"] = 0
            stats["max_access_count"] = 0

        return stats

    async def _make_request(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        method: str = "GET",
    ) -> Dict[str, Any]:
        """
        Make API request with caching, deduplication, rate limiting, and error handling.

        Args:
            endpoint: API endpoint (e.g., "/bill")
            params: Query parameters
            method: HTTP method (default: GET)

        Returns:
            API response as dictionary

        Raises:
            APIError: If request fails
            RateLimitError: If rate limited
        """
        # Generate cache key
        cache_key = self._make_cache_key(endpoint, params, method)

        # Check cache
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            get_monitor().record_cache_hit()
            return cached

        # Request deduplication: if same request is already pending, wait for it
        async with self._pending_lock:
            if cache_key in self._pending:
                # Another request for the same resource is in progress
                event = self._pending[cache_key]
                logger.debug(f"Waiting for pending request: {cache_key}")
            else:
                # Create event for this request
                event = asyncio.Event()
                self._pending[cache_key] = event
                event = None  # Signal that we should make the request

        # If we're waiting for another request
        if event is not None:
            await event.wait()
            # Check cache again after waiting
            cached = self._get_from_cache(cache_key)
            if cached is not None:
                return cached
            # If still not cached, fall through to make request

        # Make the actual request
        try:
            # Wait for rate limit
            await self.rate_limiter.acquire()

            # Build URL
            url = f"{self.base_url}{endpoint}"

            logger.debug(f"{method} {url} with params {params}")

            # Record cache miss and API call
            get_monitor().record_cache_miss()
            get_monitor().record_api_call("congress")

            response = self.session.request(
                method=method,
                url=url,
                headers=self._get_headers(),
                params=params,
                timeout=30,
            )

            # Check for errors
            if response.status_code == 401:
                raise APIError("Invalid API key. Check your CONGRESS_API_KEY.")

            if response.status_code == 429:
                raise RateLimitError("Rate limit exceeded. Try again later.")

            response.raise_for_status()

            # Parse JSON
            data = response.json()
            logger.debug(f"Response: {len(data)} bytes")

            result = cast(Dict[str, Any], data)

            # Cache the response
            self._put_in_cache(cache_key, result)

            return result

        except RateLimitError:
            raise

        except APIError:
            raise

        except requests.exceptions.Timeout:
            raise APIError("Request timed out. Check your internet connection.")

        except requests.exceptions.ConnectionError:
            raise APIError("Connection error. Check your internet connection.")

        except requests.exceptions.JSONDecodeError:
            raise APIError(f"Invalid JSON response: {response.text[:200]}")

        except requests.exceptions.HTTPError as e:
            raise APIError(f"HTTP error: {e}")

        except Exception as e:
            raise APIError(f"Unexpected error: {e}")

        finally:
            # Signal that this request is complete and remove from pending
            async with self._pending_lock:
                if cache_key in self._pending:
                    event_to_set = self._pending.pop(cache_key)
                    event_to_set.set()

    async def search_bills(
        self,
        query: str,
        congress: Optional[int] = None,
        bill_type: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        fiscal_year: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for bills by keyword with optional date filtering.

        Args:
            query: Search keywords or phrases
            congress: Congress number (e.g., 118 for 118th Congress)
            bill_type: Type of bill (hr, s, hjres, sjres, hconres, sconres, hres, sres)
            limit: Maximum number of results (1-250, default: 20)
            offset: Number of results to skip (default: 0)
            fiscal_year: Federal fiscal year (e.g., 2024). Converts to Oct 1 - Sep 30 range.
            start_date: Start date in ISO format (YYYY-MM-DD). Requires end_date.
            end_date: End date in ISO format (YYYY-MM-DD). Requires start_date.

        Returns:
            List of bill dictionaries

        Raises:
            ValueError: If parameters are invalid
            APIError: If request fails
        """
        # Validate inputs
        if not query or not query.strip():
            raise ValueError("Query cannot be empty")

        if limit < 1 or limit > 250:
            raise ValueError("Limit must be between 1 and 250")

        if offset < 0:
            raise ValueError("Offset must be non-negative")

        # Parse date parameters (validates and converts fiscal year if needed)
        filter_start_date, filter_end_date = parse_date_parameters(
            fiscal_year=fiscal_year,
            start_date=start_date,
            end_date=end_date,
            default_window_years=2,
        )

        # Build params
        params: Dict[str, Any] = {
            "query": query.strip(),
            "limit": limit,
            "offset": offset,
            "format": "json",
        }

        # Add optional filters
        endpoint = "/bill"

        if congress:
            params["congress"] = congress

        if bill_type:
            valid_types = [
                "hr",
                "s",
                "hjres",
                "sjres",
                "hconres",
                "sconres",
                "hres",
                "sres",
            ]
            if bill_type.lower() not in valid_types:
                raise ValueError(f"bill_type must be one of {valid_types}")
            params["type"] = bill_type.lower()

        # Add date filters
        if filter_start_date:
            params["fromDateTime"] = f"{filter_start_date}T00:00:00Z"
        if filter_end_date:
            params["toDateTime"] = f"{filter_end_date}T23:59:59Z"

        # Make request
        log_msg = f"Searching bills: query='{query}', limit={limit}"
        if filter_start_date and filter_end_date:
            log_msg += f", date_range={filter_start_date} to {filter_end_date}"
        logger.info(log_msg)
        response = await self._make_request(endpoint, params)

        # Extract bills from response
        bills = response.get("bills", [])
        logger.info(f"Found {len(bills)} bills")

        return cast(List[Dict[str, Any]], bills)

    async def get_bill_details(
        self, congress: int, bill_type: str, bill_number: int
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific bill.

        Args:
            congress: Congress number (e.g., 118)
            bill_type: Type of bill (hr, s, etc.)
            bill_number: Bill number

        Returns:
            Bill details dictionary

        Raises:
            ValueError: If parameters are invalid
            APIError: If request fails
        """
        # Validate inputs
        if congress < 1:
            raise ValueError("Congress number must be positive")

        if bill_number < 1:
            raise ValueError("Bill number must be positive")

        valid_types = [
            "hr",
            "s",
            "hjres",
            "sjres",
            "hconres",
            "sconres",
            "hres",
            "sres",
        ]
        if bill_type.lower() not in valid_types:
            raise ValueError(f"bill_type must be one of {valid_types}")

        # Build endpoint
        endpoint = f"/bill/{congress}/{bill_type.lower()}/{bill_number}"

        # Make request
        logger.info(
            f"Getting bill details: {bill_type.upper()} {bill_number} ({congress}th Congress)"
        )
        response = await self._make_request(endpoint)

        # Extract bill from response
        bill = response.get("bill", {})

        return cast(Dict[str, Any], bill)

    async def get_bill_text(
        self, congress: int, bill_type: str, bill_number: int, format: str = "json"
    ) -> Dict[str, Any]:
        """
        Get the text of a specific bill.

        Args:
            congress: Congress number
            bill_type: Type of bill
            bill_number: Bill number
            format: Text format (json, xml, pdf)

        Returns:
            Bill text data

        Raises:
            ValueError: If parameters are invalid
            APIError: If request fails
        """
        # Validate
        if format not in ["json", "xml", "pdf"]:
            raise ValueError("format must be one of: json, xml, pdf")

        # Build endpoint
        endpoint = f"/bill/{congress}/{bill_type.lower()}/{bill_number}/text"

        params = {"format": format}

        # Make request
        logger.info(f"Getting bill text: {bill_type.upper()} {bill_number} ({format})")
        response = await self._make_request(endpoint, params)

        return response

    async def get_bill_status(
        self, congress: int, bill_type: str, bill_number: int
    ) -> Dict[str, Any]:
        """
        Get the status and action history of a bill.

        Args:
            congress: Congress number
            bill_type: Type of bill
            bill_number: Bill number

        Returns:
            Bill status and actions

        Raises:
            ValueError: If parameters are invalid
            APIError: If request fails
        """
        # Build endpoint
        endpoint = f"/bill/{congress}/{bill_type.lower()}/{bill_number}/actions"

        # Make request
        logger.info(f"Getting bill status: {bill_type.upper()} {bill_number}")
        response = await self._make_request(endpoint)

        return response

    def close(self) -> None:
        """Close the HTTP session."""
        self.session.close()
        logger.info("Closed CongressAPIClient session")

    def __enter__(self) -> "CongressAPIClient":
        """Context manager entry."""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit."""
        self.close()

    async def __aenter__(self) -> "CongressAPIClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        self.close()
