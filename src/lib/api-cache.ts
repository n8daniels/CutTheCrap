/**
 * Generic API response cache
 * In-memory with TTL — keeps costs down by never fetching the same thing twice
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton
let instance: APICache | null = null;

export function getAPICache(): APICache {
  if (!instance) {
    instance = new APICache();
  }
  return instance;
}

// Standard TTLs
export const CACHE_TTL = {
  HOMEPAGE: 30 * 60,        // 30 minutes
  SEARCH: 15 * 60,          // 15 minutes
  BILL: 60 * 60,            // 1 hour
  MEMBER: 24 * 60 * 60,     // 24 hours
  DONORS: 24 * 60 * 60,     // 24 hours
  AI_SUMMARY: 7 * 24 * 60 * 60,  // 7 days (summaries don't change)
  CROSSWALK: 7 * 24 * 60 * 60,   // 7 days
} as const;
