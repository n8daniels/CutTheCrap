/**
 * Document Cache - Caching layer for document graphs
 * Supports both in-memory (development) and Redis (production)
 */

import { DocumentGraph } from '@/types/document';
import { config } from './config';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

export interface DocumentCache {
  get(key: string): Promise<DocumentGraph | null>;
  set(key: string, value: DocumentGraph, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<CacheStats>;
}

/**
 * In-memory cache implementation (for development)
 */
export class InMemoryDocumentCache implements DocumentCache {
  private cache = new Map<string, { value: DocumentGraph; expiresAt: number }>();
  private stats = { hits: 0, misses: 0 };

  async get(key: string): Promise<DocumentGraph | null> {
    const entry = this.cache.get(key);

    if (!entry || Date.now() > entry.expiresAt) {
      this.stats.misses++;
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  async set(key: string, value: DocumentGraph, ttlSeconds = 86400): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
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
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size: this.cache.size,
    };
  }
}

/**
 * Redis cache implementation (for production)
 */
export class RedisDocumentCache implements DocumentCache {
  private redis: any; // ioredis instance
  private stats = { hits: 0, misses: 0 };

  constructor() {
    if (config.redisUrl) {
      try {
        const Redis = require('ioredis');
        this.redis = new Redis(config.redisUrl);
      } catch (error) {
        console.warn('Redis not available, falling back to in-memory cache');
        this.redis = null;
      }
    }
  }

  async get(key: string): Promise<DocumentGraph | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get(key);

      if (!data) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(data);
    } catch (error) {
      console.error('Redis get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set(key: string, value: DocumentGraph, ttlSeconds = 86400): Promise<void> {
    if (!this.redis) return;

    try {
      const data = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, data);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    const size = this.redis ? await this.redis.dbsize() : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size,
    };
  }
}

/**
 * Factory function to create appropriate cache instance
 */
export function createDocumentCache(): DocumentCache {
  if (config.redisUrl && !config.isDevelopment) {
    return new RedisDocumentCache();
  }
  return new InMemoryDocumentCache();
}

// Singleton instance
let cacheInstance: DocumentCache | null = null;

export function getDocumentCache(): DocumentCache {
  if (!cacheInstance) {
    cacheInstance = createDocumentCache();
  }
  return cacheInstance;
}
