import type { DocumentGraph, CacheStats } from '@/types';

/**
 * Document Cache Interface
 */
export interface DocumentCache {
  get(key: string): Promise<DocumentGraph | null>;
  set(key: string, value: DocumentGraph, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<CacheStats>;
}

/**
 * In-Memory Document Cache
 * For development and testing. Use Redis in production.
 */
export class InMemoryDocumentCache implements DocumentCache {
  private cache = new Map<string, { value: DocumentGraph; expiresAt: number }>();
  private stats = { hits: 0, misses: 0 };

  async get(key: string): Promise<DocumentGraph | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  async set(key: string, value: DocumentGraph, ttlSeconds = 86400): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size,
    };
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
export const documentCache = new InMemoryDocumentCache();

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    documentCache.cleanup().then(removed => {
      if (removed > 0) {
        console.log(`Cache cleanup: removed ${removed} expired entries`);
      }
    });
  }, 3600000); // 1 hour
}
