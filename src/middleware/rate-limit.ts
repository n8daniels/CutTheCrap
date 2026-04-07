/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse and DoS attacks
 * Mitigates: API quota exhaustion, cache bypass abuse
 *
 * See: docs/security/threat_model.md - Scenario 2
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  /**
   * Time window in milliseconds
   */
  interval: number;

  /**
   * Maximum number of requests allowed per interval
   */
  uniqueTokenPerInterval: number;

  /**
   * Optional: Custom error message
   */
  message?: string;
}

interface TokenBucket {
  tokens: number[];
  lastCleanup: number;
}

/**
 * In-memory store for rate limit tracking
 * In production, use Redis for distributed rate limiting
 */
const tokenStore = new Map<string, TokenBucket>();

/**
 * Cleanup old entries periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [key, bucket] of tokenStore.entries()) {
    if (now - bucket.lastCleanup > maxAge) {
      tokenStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

/**
 * Extract client identifier from request
 * Uses multiple sources for robustness
 */
function getClientId(req: NextRequest): string {
  // Try to get real IP from proxy headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare

  // Use first available IP
  const ip = forwardedFor?.split(',')[0].trim() ||
             realIp ||
             cfConnectingIp ||
             'unknown';

  return ip;
}

/**
 * Create a rate limiter middleware
 *
 * @param config Rate limit configuration
 * @returns Middleware function that returns null to continue or Response to block
 *
 * @example
 * ```typescript
 * const limiter = rateLimit({
 *   interval: 60 * 1000, // 1 minute
 *   uniqueTokenPerInterval: 10, // 10 requests per minute
 * });
 *
 * export async function POST(req: NextRequest) {
 *   const rateLimitResponse = await limiter(req);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   // ... handle request
 * }
 * ```
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const clientId = getClientId(req);
    const now = Date.now();

    // Get or create token bucket for this client
    let bucket = tokenStore.get(clientId);
    if (!bucket) {
      bucket = { tokens: [], lastCleanup: now };
      tokenStore.set(clientId, bucket);
    }

    // Remove tokens outside the time window
    const windowStart = now - config.interval;
    bucket.tokens = bucket.tokens.filter(time => time > windowStart);
    bucket.lastCleanup = now;

    // Check if limit exceeded
    if (bucket.tokens.length >= config.uniqueTokenPerInterval) {
      const oldestToken = Math.min(...bucket.tokens);
      const retryAfter = Math.ceil((oldestToken + config.interval - now) / 1000);

      return NextResponse.json(
        {
          error: config.message || 'Rate limit exceeded. Please try again later.',
          retryAfter: `${retryAfter} seconds`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.uniqueTokenPerInterval),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((oldestToken + config.interval) / 1000)),
          },
        }
      );
    }

    // Add new token
    bucket.tokens.push(now);

    // Add rate limit headers to successful responses
    req.headers.set('X-RateLimit-Limit', String(config.uniqueTokenPerInterval));
    req.headers.set('X-RateLimit-Remaining', String(config.uniqueTokenPerInterval - bucket.tokens.length));

    return null; // Allow request to continue
  };
}

/**
 * Preset rate limiters for common use cases
 */
export const RateLimitPresets = {
  /**
   * Standard API rate limit: 60 requests per minute
   */
  standard: rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 60,
    message: 'Too many requests. Please slow down.',
  }),

  /**
   * Strict rate limit for expensive operations: 10 requests per minute
   */
  strict: rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 10,
    message: 'This endpoint is rate limited. Please wait before retrying.',
  }),

  /**
   * Very strict for cache bypass operations: 5 requests per hour
   */
  cacheBypass: rateLimit({
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 5,
    message: 'Force refresh is heavily rate limited. Please use cached data.',
  }),

  /**
   * Generous limit for read-only operations: 120 requests per minute
   */
  readonly: rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 120,
  }),
};

/**
 * Combine multiple rate limiters
 * Useful for applying different limits to the same endpoint
 *
 * @param limiters Array of rate limiter functions
 * @returns Combined rate limiter
 */
export function combineRateLimiters(...limiters: Array<(req: NextRequest) => Promise<NextResponse | null>>) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    for (const limiter of limiters) {
      const response = await limiter(req);
      if (response) {
        return response; // First limiter to trigger wins
      }
    }
    return null;
  };
}
