"""Tests for cache utilities with enhanced metadata tracking."""

import time
from src.utils.cache import CacheEntry, CacheStats


class TestCacheEntry:
    """Test CacheEntry class."""

    def test_cache_entry_creation(self) -> None:
        """Test creating a cache entry."""
        data = {"key": "value", "number": 42}
        entry = CacheEntry(data=data)

        assert entry.data == data
        assert entry.version == "1"
        assert entry.access_count == 0
        assert entry.created_at > 0
        assert entry.last_accessed > 0
        assert entry.size > 0

    def test_cache_entry_with_custom_version(self) -> None:
        """Test creating a cache entry with custom version."""
        data = {"key": "value"}
        entry = CacheEntry(data=data, version="2.0")

        assert entry.version == "2.0"

    def test_cache_entry_with_custom_ttl(self) -> None:
        """Test creating a cache entry with custom TTL."""
        data = {"key": "value"}
        entry = CacheEntry(data=data, ttl=600.0)

        assert entry.ttl == 600.0

    def test_cache_entry_age(self) -> None:
        """Test age calculation."""
        data = {"key": "value"}
        entry = CacheEntry(data=data)

        time.sleep(0.1)  # Wait 100ms

        assert entry.age >= 0.1
        assert entry.age < 0.5  # Allow more time for system overhead

    def test_cache_entry_mark_accessed(self) -> None:
        """Test marking an entry as accessed."""
        data = {"key": "value"}
        entry = CacheEntry(data=data)

        initial_access_time = entry.last_accessed
        initial_count = entry.access_count

        time.sleep(0.05)
        entry.mark_accessed()

        assert entry.access_count == initial_count + 1
        assert entry.last_accessed > initial_access_time

    def test_cache_entry_multiple_accesses(self) -> None:
        """Test multiple accesses."""
        data = {"key": "value"}
        entry = CacheEntry(data=data)

        for i in range(5):
            entry.mark_accessed()

        assert entry.access_count == 5

    def test_cache_entry_time_since_access(self) -> None:
        """Test time since last access."""
        data = {"key": "value"}
        entry = CacheEntry(data=data)

        time.sleep(0.1)

        assert entry.time_since_access >= 0.1
        assert entry.time_since_access < 0.5  # Allow more time for system overhead

    def test_cache_entry_is_expired_default_ttl(self) -> None:
        """Test expiration with default TTL."""
        data = {"key": "value"}
        entry = CacheEntry(data=data)

        # Fresh entry should not be expired
        assert not entry.is_expired(300.0)

        # Simulate old entry by setting created_at
        entry.created_at = time.time() - 400.0

        # Should be expired now
        assert entry.is_expired(300.0)

    def test_cache_entry_is_expired_custom_ttl(self) -> None:
        """Test expiration with custom TTL."""
        data = {"key": "value"}
        entry = CacheEntry(data=data, ttl=100.0)

        # Fresh entry should not be expired
        assert not entry.is_expired(300.0)  # Uses custom TTL of 100

        # Simulate old entry
        entry.created_at = time.time() - 150.0

        # Should be expired now (custom TTL is 100)
        assert entry.is_expired(300.0)

    def test_cache_entry_size(self) -> None:
        """Test size calculation."""
        small_data = {"key": "value"}
        small_entry = CacheEntry(data=small_data)

        large_data = {"key": "value" * 1000, "numbers": list(range(1000))}
        large_entry = CacheEntry(data=large_data)

        assert small_entry.size > 0
        assert large_entry.size > small_entry.size

    def test_cache_entry_to_dict(self) -> None:
        """Test converting entry metadata to dictionary."""
        data = {"key": "value"}
        entry = CacheEntry(data=data, version="2.0", ttl=600.0)

        metadata = entry.to_dict()

        assert "created_at" in metadata
        assert "last_accessed" in metadata
        assert "access_count" in metadata
        assert "version" in metadata
        assert "age" in metadata
        assert "time_since_access" in metadata
        assert "size" in metadata
        assert "ttl" in metadata

        assert metadata["version"] == "2.0"
        assert metadata["ttl"] == 600.0
        assert metadata["access_count"] == 0


class TestCacheStats:
    """Test CacheStats class."""

    def test_cache_stats_initialization(self) -> None:
        """Test initializing cache stats."""
        stats = CacheStats()

        assert stats.hits == 0
        assert stats.misses == 0
        assert stats.expirations == 0
        assert stats.evictions == 0
        assert stats.total_size == 0
        assert stats.total_requests == 0
        assert stats.hit_rate == 0.0

    def test_cache_stats_record_hit(self) -> None:
        """Test recording a cache hit."""
        stats = CacheStats()

        stats.record_hit()

        assert stats.hits == 1
        assert stats.total_requests == 1
        assert stats.hit_rate == 1.0

    def test_cache_stats_record_miss(self) -> None:
        """Test recording a cache miss."""
        stats = CacheStats()

        stats.record_miss()

        assert stats.misses == 1
        assert stats.total_requests == 1
        assert stats.hit_rate == 0.0

    def test_cache_stats_hit_rate_calculation(self) -> None:
        """Test hit rate calculation."""
        stats = CacheStats()

        # 3 hits, 1 miss = 75% hit rate
        stats.record_hit()
        stats.record_hit()
        stats.record_hit()
        stats.record_miss()

        assert stats.total_requests == 4
        assert stats.hit_rate == 0.75

    def test_cache_stats_record_expiration(self) -> None:
        """Test recording a cache expiration."""
        stats = CacheStats()

        stats.record_expiration()

        assert stats.expirations == 1

    def test_cache_stats_record_eviction(self) -> None:
        """Test recording a cache eviction."""
        stats = CacheStats()

        stats.record_eviction()

        assert stats.evictions == 1

    def test_cache_stats_update_size(self) -> None:
        """Test updating total size."""
        stats = CacheStats()

        stats.update_size(1000)
        assert stats.total_size == 1000

        stats.update_size(500)
        assert stats.total_size == 1500

        stats.update_size(-300)
        assert stats.total_size == 1200

    def test_cache_stats_to_dict(self) -> None:
        """Test converting stats to dictionary."""
        stats = CacheStats()

        stats.record_hit()
        stats.record_hit()
        stats.record_miss()
        stats.record_expiration()
        stats.record_eviction()
        stats.update_size(5000)

        stats_dict = stats.to_dict()

        assert stats_dict["hits"] == 2
        assert stats_dict["misses"] == 1
        assert stats_dict["total_requests"] == 3
        assert stats_dict["hit_rate"] == 2 / 3
        assert stats_dict["expirations"] == 1
        assert stats_dict["evictions"] == 1
        assert stats_dict["total_size_bytes"] == 5000

    def test_cache_stats_reset(self) -> None:
        """Test resetting stats."""
        stats = CacheStats()

        # Record some activity
        stats.record_hit()
        stats.record_miss()
        stats.record_expiration()
        stats.update_size(1000)

        # Reset
        stats.reset()

        assert stats.hits == 0
        assert stats.misses == 0
        assert stats.expirations == 0
        assert stats.evictions == 0
        assert stats.total_size == 0
        assert stats.total_requests == 0
        assert stats.hit_rate == 0.0


class TestCacheEntryIntegration:
    """Test CacheEntry integration with common use cases."""

    def test_cache_lifecycle(self) -> None:
        """Test full cache entry lifecycle."""
        data = {"response": "data"}
        entry = CacheEntry(data=data, ttl=1.0)

        # Fresh entry
        assert not entry.is_expired(1.0)
        assert entry.access_count == 0

        # Access entry
        entry.mark_accessed()
        assert entry.access_count == 1

        # Wait for expiration
        time.sleep(1.1)
        assert entry.is_expired(1.0)

    def test_frequently_accessed_entry(self) -> None:
        """Test entry that is accessed frequently."""
        data = {"popular": "resource"}
        entry = CacheEntry(data=data)

        # Simulate frequent access
        for _ in range(100):
            entry.mark_accessed()

        assert entry.access_count == 100
        assert entry.time_since_access < 0.1  # Recently accessed

    def test_cache_entry_metadata_tracking(self) -> None:
        """Test that metadata is properly tracked."""
        data = {"test": "data"}
        entry = CacheEntry(data=data, version="1.0", ttl=300.0)

        # Verify initial state
        metadata = entry.to_dict()
        assert metadata["access_count"] == 0
        assert metadata["version"] == "1.0"
        assert metadata["ttl"] == 300.0

        # Access and verify update
        entry.mark_accessed()
        entry.mark_accessed()

        metadata = entry.to_dict()
        assert metadata["access_count"] == 2
