"""
Cache utilities for enhanced cache management with metadata tracking.

Provides structured cache entries with timestamp, access tracking, and versioning
for better cache observability and management.
"""

import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional
import sys


@dataclass
class CacheEntry:
    """
    Cache entry with metadata for enhanced cache management.

    Tracks when entries were created, accessed, and provides versioning
    for cache invalidation strategies.
    """

    data: Dict[str, Any]
    """The cached response data"""

    created_at: float = field(default_factory=time.time)
    """Timestamp when this entry was created"""

    last_accessed: float = field(default_factory=time.time)
    """Timestamp when this entry was last accessed"""

    access_count: int = 0
    """Number of times this entry has been accessed"""

    version: str = "1"
    """Cache version for invalidation (default: "1")"""

    ttl: Optional[float] = None
    """Custom TTL for this entry in seconds (None = use default)"""

    def __post_init__(self) -> None:
        """Calculate initial size after initialization."""
        self._size = self._calculate_size()

    def _calculate_size(self) -> int:
        """
        Calculate approximate size of cached data in bytes.

        Returns:
            Approximate size in bytes
        """
        return sys.getsizeof(str(self.data))

    @property
    def size(self) -> int:
        """
        Get approximate size of cached data.

        Returns:
            Size in bytes
        """
        return self._size

    @property
    def age(self) -> float:
        """
        Get age of cache entry in seconds.

        Returns:
            Age in seconds since creation
        """
        return time.time() - self.created_at

    @property
    def time_since_access(self) -> float:
        """
        Get time since last access in seconds.

        Returns:
            Time in seconds since last access
        """
        return time.time() - self.last_accessed

    def is_expired(self, default_ttl: float) -> bool:
        """
        Check if cache entry is expired.

        Args:
            default_ttl: Default TTL to use if entry has no custom TTL

        Returns:
            True if entry is expired, False otherwise
        """
        ttl = self.ttl if self.ttl is not None else default_ttl
        return self.age > ttl

    def mark_accessed(self) -> None:
        """Mark this entry as accessed (updates last_accessed and access_count)."""
        self.last_accessed = time.time()
        self.access_count += 1

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert cache entry metadata to dictionary for logging/monitoring.

        Returns:
            Dictionary with metadata fields
        """
        return {
            "created_at": self.created_at,
            "last_accessed": self.last_accessed,
            "access_count": self.access_count,
            "version": self.version,
            "age": self.age,
            "time_since_access": self.time_since_access,
            "size": self.size,
            "ttl": self.ttl,
        }


class CacheStats:
    """
    Track cache statistics across all entries.

    Provides insights into cache performance, memory usage, and access patterns.
    """

    def __init__(self) -> None:
        """Initialize cache statistics."""
        self.hits = 0
        self.misses = 0
        self.expirations = 0
        self.evictions = 0
        self.total_size = 0

    @property
    def total_requests(self) -> int:
        """Get total cache requests (hits + misses)."""
        return self.hits + self.misses

    @property
    def hit_rate(self) -> float:
        """
        Calculate cache hit rate.

        Returns:
            Hit rate as percentage (0.0 to 1.0)
        """
        if self.total_requests == 0:
            return 0.0
        return self.hits / self.total_requests

    def record_hit(self) -> None:
        """Record a cache hit."""
        self.hits += 1

    def record_miss(self) -> None:
        """Record a cache miss."""
        self.misses += 1

    def record_expiration(self) -> None:
        """Record a cache expiration."""
        self.expirations += 1

    def record_eviction(self) -> None:
        """Record a cache eviction."""
        self.evictions += 1

    def update_size(self, delta: int) -> None:
        """
        Update total cache size.

        Args:
            delta: Change in size (positive for additions, negative for removals)
        """
        self.total_size += delta

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert statistics to dictionary.

        Returns:
            Dictionary with all statistics
        """
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": self.total_requests,
            "hit_rate": self.hit_rate,
            "expirations": self.expirations,
            "evictions": self.evictions,
            "total_size_bytes": self.total_size,
        }

    def reset(self) -> None:
        """Reset all statistics to zero."""
        self.hits = 0
        self.misses = 0
        self.expirations = 0
        self.evictions = 0
        self.total_size = 0
