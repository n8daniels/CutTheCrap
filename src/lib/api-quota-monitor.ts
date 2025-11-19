/**
 * API Quota Monitoring System
 *
 * SECURITY: Tracks Congress.gov API usage to prevent quota exhaustion
 * Congress.gov API limit: 5000 requests/hour
 *
 * See: docs/security/API_KEY_SECURITY.md
 */

export interface QuotaUsage {
  hour: string; // ISO 8601 hour (e.g., "2025-01-18T10:00:00Z")
  requests: number;
  limit: number;
  percentUsed: number;
  firstRequest: string; // ISO timestamp
  lastRequest: string; // ISO timestamp
}

export interface QuotaAlert {
  timestamp: string;
  level: 'warning' | 'critical' | 'exceeded';
  currentUsage: number;
  limit: number;
  percentUsed: number;
  message: string;
}

/**
 * API Quota Monitor - Tracks usage and alerts on thresholds
 */
export class APIQuotaMonitor {
  // Congress.gov API limit
  private readonly HOURLY_LIMIT = 5000;

  // Alert thresholds
  private readonly WARNING_THRESHOLD = 0.7; // 70% = 3500 requests
  private readonly CRITICAL_THRESHOLD = 0.9; // 90% = 4500 requests

  // In-memory storage (use Redis in production)
  private usage: Map<string, QuotaUsage> = new Map();
  private alerts: QuotaAlert[] = [];

  // Alert callbacks
  private onAlert?: (alert: QuotaAlert) => void;

  constructor(options?: { onAlert?: (alert: QuotaAlert) => void }) {
    this.onAlert = options?.onAlert;

    // Clean up old usage data every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Track an API request
   *
   * SECURITY: Monitors usage and triggers alerts at thresholds
   */
  trackRequest(endpoint: string = 'congress.gov'): void {
    const now = new Date();
    const hourKey = this.getHourKey(now);

    let usage = this.usage.get(hourKey);

    if (!usage) {
      usage = {
        hour: hourKey,
        requests: 0,
        limit: this.HOURLY_LIMIT,
        percentUsed: 0,
        firstRequest: now.toISOString(),
        lastRequest: now.toISOString(),
      };
      this.usage.set(hourKey, usage);
    }

    // Increment request count
    usage.requests++;
    usage.lastRequest = now.toISOString();
    usage.percentUsed = (usage.requests / usage.limit) * 100;

    // Check alert thresholds
    this.checkThresholds(usage);

    // Log usage
    if (usage.requests % 100 === 0) {
      console.log(
        `[QUOTA] Congress.gov API: ${usage.requests}/${usage.limit} ` +
        `(${usage.percentUsed.toFixed(1)}%) in hour ${hourKey}`
      );
    }
  }

  /**
   * Check if thresholds are exceeded and trigger alerts
   */
  private checkThresholds(usage: QuotaUsage): void {
    const percent = usage.percentUsed / 100;

    // Exceeded limit
    if (usage.requests >= usage.limit) {
      this.triggerAlert({
        timestamp: new Date().toISOString(),
        level: 'exceeded',
        currentUsage: usage.requests,
        limit: usage.limit,
        percentUsed: usage.percentUsed,
        message: `🚨 QUOTA EXCEEDED: ${usage.requests}/${usage.limit} requests used. API calls will fail!`,
      });
    }
    // Critical threshold (90%)
    else if (percent >= this.CRITICAL_THRESHOLD && usage.requests % 50 === 0) {
      this.triggerAlert({
        timestamp: new Date().toISOString(),
        level: 'critical',
        currentUsage: usage.requests,
        limit: usage.limit,
        percentUsed: usage.percentUsed,
        message: `⚠️ QUOTA CRITICAL: ${usage.requests}/${usage.limit} requests used (${usage.percentUsed.toFixed(1)}%). Approaching limit!`,
      });
    }
    // Warning threshold (70%)
    else if (percent >= this.WARNING_THRESHOLD && usage.requests % 100 === 0) {
      this.triggerAlert({
        timestamp: new Date().toISOString(),
        level: 'warning',
        currentUsage: usage.requests,
        limit: usage.limit,
        percentUsed: usage.percentUsed,
        message: `⚠️ QUOTA WARNING: ${usage.requests}/${usage.limit} requests used (${usage.percentUsed.toFixed(1)}%). Monitor usage closely.`,
      });
    }
  }

  /**
   * Trigger quota alert
   */
  private triggerAlert(alert: QuotaAlert): void {
    // Store alert
    this.alerts.push(alert);

    // Trim alert history (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log alert
    if (alert.level === 'exceeded') {
      console.error(alert.message);
    } else if (alert.level === 'critical') {
      console.warn(alert.message);
    } else {
      console.log(alert.message);
    }

    // Call alert callback if configured
    if (this.onAlert) {
      try {
        this.onAlert(alert);
      } catch (error) {
        console.error('[QUOTA] Error in alert callback:', error);
      }
    }
  }

  /**
   * Get current usage for the current hour
   */
  getCurrentUsage(): QuotaUsage | null {
    const hourKey = this.getHourKey(new Date());
    return this.usage.get(hourKey) || null;
  }

  /**
   * Get all usage data
   */
  getAllUsage(): QuotaUsage[] {
    return Array.from(this.usage.values());
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): QuotaAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Check if we're close to quota limit
   */
  isNearLimit(threshold: number = 0.9): boolean {
    const current = this.getCurrentUsage();
    if (!current) return false;

    return current.percentUsed / 100 >= threshold;
  }

  /**
   * Get remaining requests for current hour
   */
  getRemainingRequests(): number {
    const current = this.getCurrentUsage();
    if (!current) return this.HOURLY_LIMIT;

    return Math.max(0, this.HOURLY_LIMIT - current.requests);
  }

  /**
   * Get hour key for grouping (YYYY-MM-DDTHH:00:00Z)
   */
  private getHourKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:00:00Z`;
  }

  /**
   * Clean up old usage data (older than 24 hours)
   */
  private cleanup(): void {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [key, usage] of this.usage.entries()) {
      const usageDate = new Date(usage.hour);
      if (usageDate < cutoff) {
        this.usage.delete(key);
        console.log(`[QUOTA] Cleaned up usage data for ${key}`);
      }
    }
  }

  /**
   * Reset quota (for testing)
   */
  reset(): void {
    this.usage.clear();
    this.alerts = [];
    console.log('[QUOTA] Reset all usage data');
  }
}

// Singleton instance
let quotaMonitorInstance: APIQuotaMonitor | null = null;

/**
 * Get the global quota monitor instance
 */
export function getQuotaMonitor(options?: { onAlert?: (alert: QuotaAlert) => void }): APIQuotaMonitor {
  if (!quotaMonitorInstance) {
    quotaMonitorInstance = new APIQuotaMonitor(options);
  }
  return quotaMonitorInstance;
}

/**
 * Simple function to track a Congress.gov API request
 *
 * SECURITY: Call this after every Congress.gov API request
 */
export function trackCongressAPIRequest(): void {
  const monitor = getQuotaMonitor();
  monitor.trackRequest();
}

/**
 * Check if we should throttle requests due to quota
 *
 * SECURITY: Use this before making optional/non-critical API calls
 */
export function shouldThrottleRequests(threshold: number = 0.85): boolean {
  const monitor = getQuotaMonitor();
  return monitor.isNearLimit(threshold);
}
