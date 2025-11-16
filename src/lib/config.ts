/**
 * Application configuration
 * Validates required environment variables
 */

export const config = {
  congressApiKey: process.env.CONGRESS_API_KEY || '',
  fedDocMcpPath: process.env.FEDDOC_MCP_PATH || './packages/feddoc-mcp/src/server.py',
  fedDocMcpEnabled: process.env.FEDDOC_MCP_ENABLED === 'true',
} as const;

/**
 * Validates that required configuration is present
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.congressApiKey) {
    errors.push('CONGRESS_API_KEY is required. Get one at https://api.congress.gov/sign-up/');
  }

  if (config.fedDocMcpEnabled && !config.fedDocMcpPath) {
    errors.push('FEDDOC_MCP_PATH is required when FEDDOC_MCP_ENABLED=true');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
