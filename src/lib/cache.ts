/**
 * Simple in-memory cache for v0.1
 * Future: Replace with Redis for production
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

export class InMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = { hits: 0, misses: 0 };

  /**
   * Get value from cache
   */
  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry || Date.now() > entry.expiresAt) {
      this.stats.misses++;
      if (entry) {
        // Clean up expired entry
        this.cache.delete(key);
      }
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size: this.cache.size,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance for bills
export const billCache = new InMemoryCache<any>();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => billCache.cleanup(), 5 * 60 * 1000);
}
