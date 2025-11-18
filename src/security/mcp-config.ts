/**
 * MCP Security Configuration
 *
 * Security controls for Model Context Protocol server integration
 * Based on security analysis findings from docs/security/threat_model.md
 */

export const MCP_SECURITY_CONFIG = {
  /**
   * SECURITY: Hardcoded allowlist of valid MCP server paths
   * Mitigates: Command injection vulnerability (P0 Critical)
   * See: docs/security/threat_model.md - Scenario 1
   */
  allowedServerPaths: [
    './packages/feddoc-mcp/src/server.py',
    '/opt/feddoc-mcp/server.py', // Production path
  ] as const,

  /**
   * SECURITY: Allowlist of environment variables to pass to subprocess
   * Mitigates: Environment variable leakage (P0 Critical)
   * See: docs/security/threat_model.md - Scenario 5
   */
  allowedEnvVars: [
    'CONGRESS_API_KEY',
    'NODE_ENV',
  ] as const,

  /**
   * SECURITY: Allowed bill types for validation
   * Mitigates: SSRF via bill_type parameter (P2 Medium)
   * See: docs/security/llm-rag-mcp-security.md - Section 1
   */
  validBillTypes: [
    'hr',      // House Resolution
    's',       // Senate bill
    'hjres',   // House Joint Resolution
    'sjres',   // Senate Joint Resolution
    'hconres', // House Concurrent Resolution
    'sconres', // Senate Concurrent Resolution
    'hres',    // House Simple Resolution
    'sres',    // Senate Simple Resolution
  ] as const,

  /**
   * Resource limits for MCP server subprocess
   */
  resourceLimits: {
    maxExecutionTimeMs: 60000, // 60 seconds
    maxMemoryMB: 512,
    maxConcurrentConnections: 10,
  },

  /**
   * Rate limiting configuration for MCP tool calls
   */
  rateLimits: {
    search_bills: { maxCalls: 100, windowSeconds: 3600 },    // 100/hour
    get_bill_text: { maxCalls: 200, windowSeconds: 3600 },   // 200/hour
    get_bill_status: { maxCalls: 500, windowSeconds: 3600 }, // 500/hour
  },
} as const;

/**
 * Validate MCP server path against allowlist
 *
 * @throws Error if path is not in allowlist
 */
export function validateMCPServerPath(path: string): void {
  if (!MCP_SECURITY_CONFIG.allowedServerPaths.includes(path as any)) {
    throw new Error(
      `[SECURITY] Invalid MCP server path: ${path}. ` +
      `Must be one of: ${MCP_SECURITY_CONFIG.allowedServerPaths.join(', ')}`
    );
  }
}

/**
 * Validate bill type against allowlist
 *
 * @throws Error if bill type is not valid
 */
export function validateBillType(billType: string): string {
  const normalized = billType.toLowerCase().trim();

  if (!MCP_SECURITY_CONFIG.validBillTypes.includes(normalized as any)) {
    throw new Error(
      `[SECURITY] Invalid bill type: ${billType}. ` +
      `Must be one of: ${MCP_SECURITY_CONFIG.validBillTypes.join(', ')}`
    );
  }

  return normalized;
}

/**
 * Build secure environment for subprocess
 * Only includes allowlisted environment variables
 *
 * @returns Filtered environment object safe to pass to subprocess
 */
export function buildSecureEnv(): Record<string, string> {
  const secureEnv: Record<string, string> = {};

  for (const key of MCP_SECURITY_CONFIG.allowedEnvVars) {
    const value = process.env[key];
    if (value !== undefined) {
      secureEnv[key] = value;
    }
  }

  return secureEnv;
}

/**
 * Type guard for valid bill types
 */
export type ValidBillType = typeof MCP_SECURITY_CONFIG.validBillTypes[number];
