/**
 * Audit Logging System
 *
 * Provides comprehensive security audit logging for CutTheCrap
 * Logs all security-relevant events for monitoring and incident response
 *
 * See: docs/security/llm-rag-mcp-security.md - Audit Logging Requirements
 */

export type AuditEventType =
  | 'mcp_tool_call'
  | 'api_request'
  | 'cache_hit'
  | 'cache_miss'
  | 'rate_limit_exceeded'
  | 'validation_error'
  | 'security_error'
  | 'error';

export interface AuditLog {
  /** ISO 8601 timestamp */
  timestamp: string;

  /** Type of event being logged */
  eventType: AuditEventType;

  /** User ID (for future authentication) */
  userId?: string;

  /** Client IP address */
  ipAddress: string;

  /** Resource being accessed (bill ID, tool name, etc.) */
  resource: string;

  /** Action performed */
  action: string;

  /** Request parameters (secrets scrubbed) */
  parameters: Record<string, any>;

  /** Result of the action */
  result: 'success' | 'failure';

  /** Duration in milliseconds */
  durationMs?: number;

  /** Error message if result was failure */
  error?: string;

  /** Additional context */
  metadata?: Record<string, any>;
}

/**
 * Sensitive keys that should be scrubbed from logs
 */
const SENSITIVE_KEYS = [
  'api_key',
  'apikey',
  'api-key',
  'token',
  'password',
  'secret',
  'authorization',
  'auth',
  'bearer',
  'cookie',
  'session',
];

/**
 * Scrub sensitive data from parameters before logging
 *
 * @param params Object potentially containing secrets
 * @returns Sanitized object safe for logging
 */
export function scrubSecrets(params: Record<string, any>): Record<string, any> {
  if (!params || typeof params !== 'object') {
    return params;
  }

  const scrubbed: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains any sensitive keywords
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      lowerKey.includes(sensitiveKey)
    );

    if (isSensitive) {
      scrubbed[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      // Recursively scrub nested objects
      scrubbed[key] = scrubSecrets(value);
    } else if (typeof value === 'string' && value.length > 1000) {
      // Truncate very long strings
      scrubbed[key] = value.substring(0, 1000) + '... [truncated]';
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}

/**
 * Log an audit event
 *
 * SECURITY: All parameters are automatically scrubbed of sensitive data
 *
 * @param log Audit log entry
 */
export async function logAudit(log: AuditLog): Promise<void> {
  // SECURITY: Always scrub secrets before logging
  const scrubbedLog: AuditLog = {
    ...log,
    parameters: scrubSecrets(log.parameters),
    metadata: log.metadata ? scrubSecrets(log.metadata) : undefined,
  };

  // Format as JSON for structured logging
  const logEntry = JSON.stringify(scrubbedLog);

  // Log to console (in production, send to logging service)
  console.log(`[AUDIT] ${logEntry}`);

  // TODO: In production, also send to:
  // - Datadog, CloudWatch, or other logging service
  // - SIEM for security monitoring
  // - Long-term storage for compliance (1 year retention)

  // Example production integration:
  // await sendToDatadog(scrubbedLog);
  // await sendToSIEM(scrubbedLog);
}

/**
 * Log MCP tool call
 */
export async function logMCPToolCall(params: {
  toolName: string;
  arguments: Record<string, any>;
  result: 'success' | 'failure';
  durationMs: number;
  ipAddress: string;
  error?: string;
}): Promise<void> {
  await logAudit({
    timestamp: new Date().toISOString(),
    eventType: 'mcp_tool_call',
    ipAddress: params.ipAddress,
    resource: `mcp:${params.toolName}`,
    action: 'call_tool',
    parameters: params.arguments,
    result: params.result,
    durationMs: params.durationMs,
    error: params.error,
  });
}

/**
 * Log API request
 */
export async function logAPIRequest(params: {
  endpoint: string;
  method: string;
  parameters: Record<string, any>;
  result: 'success' | 'failure';
  durationMs: number;
  ipAddress: string;
  statusCode: number;
  error?: string;
}): Promise<void> {
  await logAudit({
    timestamp: new Date().toISOString(),
    eventType: 'api_request',
    ipAddress: params.ipAddress,
    resource: params.endpoint,
    action: params.method.toUpperCase(),
    parameters: params.parameters,
    result: params.result,
    durationMs: params.durationMs,
    error: params.error,
    metadata: {
      statusCode: params.statusCode,
    },
  });
}

/**
 * Log rate limit exceeded event
 */
export async function logRateLimitExceeded(params: {
  endpoint: string;
  ipAddress: string;
  limit: number;
  window: number;
}): Promise<void> {
  await logAudit({
    timestamp: new Date().toISOString(),
    eventType: 'rate_limit_exceeded',
    ipAddress: params.ipAddress,
    resource: params.endpoint,
    action: 'rate_limit_check',
    parameters: {},
    result: 'failure',
    metadata: {
      limit: params.limit,
      windowMs: params.window,
    },
  });
}

/**
 * Log security error (validation failure, injection attempt, etc.)
 */
export async function logSecurityError(params: {
  type: string;
  message: string;
  ipAddress: string;
  resource?: string;
  parameters?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    timestamp: new Date().toISOString(),
    eventType: 'security_error',
    ipAddress: params.ipAddress,
    resource: params.resource || 'unknown',
    action: params.type,
    parameters: params.parameters || {},
    result: 'failure',
    error: params.message,
  });
}

/**
 * Helper to extract IP from Next.js request
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
