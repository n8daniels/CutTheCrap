"""
GovInfo API client.

Handles all interactions with the GovInfo.gov API including caching,
rate limiting, retry logic, and error handling.
"""

import time
import logging
import asyncio
from typing import Dict, List, Optional, Any, cast
from datetime import datetime

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

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

    Implements a sliding window rate limiter.
    """

    def __init__(self, max_requests: int = 1000, window_seconds: int = 3600) -> None:
        """
        Initialize rate limiter.

        Args:
            max_requests: Maximum requests allowed in window (default: 1000/hour)
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


class GovInfoClient:
    """
    Client for GovInfo.gov API.

    Provides methods for searching government documents, accessing collections,
    and retrieving document metadata from the GPO's GovInfo system.
    """

    def __init__(self, api_key: str, cache_ttl: int = 300) -> None:
        """
        Initialize API client.

        Args:
            api_key: GovInfo API key from api.data.gov
            cache_ttl: Cache time-to-live in seconds (default: 300 = 5 minutes)

        Raises:
            ValueError: If API key is missing or invalid
        """
        if not api_key or not api_key.strip():
            raise ValueError(
                "GovInfo API key is required. Get one at https://api.data.gov/signup/"
            )

        self.api_key = api_key.strip()
        self.base_url = "https://api.govinfo.gov"
        self.cache_ttl = cache_ttl

        # Set up rate limiter (1000 req/hour - api.data.gov default)
        self.rate_limiter = RateLimiter(
            max_requests=1000,
            window_seconds=3600,
        )

        # Set up session with retry logic
        self.session = self._create_session()

        # Response cache: {cache_key: CacheEntry}
        self._cache: Dict[str, CacheEntry] = {}
        self._cache_stats = CacheStats()

        # Pending requests: {cache_key: asyncio.Event} for deduplication
        self._pending: Dict[str, asyncio.Event] = {}
        self._pending_lock = asyncio.Lock()

        logger.info(f"Initialized GovInfoClient with base URL: {self.base_url}")

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
        return {
            "Accept": "application/json",
            "User-Agent": "FedDocMCP/0.3.0 (github.com/n8daniels/FedDocMCP)",
            "X-Api-Key": self.api_key,
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
            endpoint: API endpoint (e.g., "/collections")
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

            # Add API key to params
            if params is None:
                params = {}
            params["api_key"] = self.api_key

            logger.debug(f"{method} {url} with params {params}")

            # Record cache miss and API call
            get_monitor().record_cache_miss()
            get_monitor().record_api_call("govinfo")

            response = self.session.request(
                method=method,
                url=url,
                headers=self._get_headers(),
                params=params,
                timeout=30,
            )

            # Check for errors
            if response.status_code == 429:
                raise RateLimitError("Rate limit exceeded. Try again later.")

            response.raise_for_status()

            # Parse JSON
            data = response.json()
            logger.debug(f"Response: {len(str(data))} bytes")

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

    async def list_collections(self) -> List[Dict[str, Any]]:
        """
        List all available GovInfo collections.

        Returns:
            List of collection dictionaries with collectionCode, collectionName, etc.

        Raises:
            APIError: If request fails
        """
        logger.info("Listing GovInfo collections")
        response = await self._make_request("/collections")

        # Extract collections from response
        collections = response.get("collections", [])
        logger.info(f"Found {len(collections)} collections")

        return cast(List[Dict[str, Any]], collections)

    async def search_collection(
        self,
        collection_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search for packages in a specific collection by date range.

        Args:
            collection_code: Collection code (e.g., "BILLS", "FR", "CHRG")
            start_date: Start date in ISO format (YYYY-MM-DD)
            end_date: End date in ISO format (YYYY-MM-DD)
            limit: Maximum number of results (1-1000, default: 20)

        Returns:
            List of package dictionaries

        Raises:
            ValueError: If parameters are invalid
            APIError: If request fails
        """
        # Validate inputs
        if not collection_code or not collection_code.strip():
            raise ValueError("Collection code cannot be empty")

        if limit < 1 or limit > 1000:
            raise ValueError("Limit must be between 1 and 1000")

        collection_code = collection_code.strip().upper()

        # Parse date parameters (default to last 30 days if not provided)
        if not start_date and not end_date:
            # Default to last 30 days
            from datetime import datetime, timedelta

            end = datetime.now()
            start = end - timedelta(days=30)
            start_date = start.strftime("%Y-%m-%d")
            end_date = end.strftime("%Y-%m-%d")

        # Build endpoint
        if start_date:
            # Use published endpoint for date range
            endpoint = f"/published/{start_date}/{end_date}"
            params = {
                "offsetMark": "*",
                "pageSize": min(limit, 100),  # GovInfo has max pageSize of 100
                "collection": collection_code,
            }
        else:
            raise ValueError("Date range is required")

        # Make request
        log_msg = f"Searching collection '{collection_code}': {start_date} to {end_date}, limit={limit}"
        logger.info(log_msg)

        response = await self._make_request(endpoint, params)

        # Extract packages from response
        packages = response.get("packages", [])
        logger.info(f"Found {len(packages)} packages")

        return cast(List[Dict[str, Any]], packages)

    async def get_package_summary(self, package_id: str) -> Dict[str, Any]:
        """
        Get summary metadata for a specific package.

        Args:
            package_id: Package identifier (e.g., "BILLS-115hr1625enr")

        Returns:
            Package summary dictionary with metadata and download links

        Raises:
            ValueError: If parameters are invalid
            APIError: If request fails
        """
        # Validate inputs
        if not package_id or not package_id.strip():
            raise ValueError("Package ID cannot be empty")

        # Build endpoint
        endpoint = f"/packages/{package_id.strip()}/summary"

        # Make request
        logger.info(f"Getting package summary: {package_id}")
        response = await self._make_request(endpoint)

        return response

    def close(self) -> None:
        """Close the HTTP session."""
        self.session.close()
        logger.info("Closed GovInfoClient session")

    def __enter__(self) -> "GovInfoClient":
        """Context manager entry."""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit."""
        self.close()

    async def __aenter__(self) -> "GovInfoClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        self.close()
