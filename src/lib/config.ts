/**
 * Application configuration
 * Validates and exports environment variables
 */

export const config = {
  // Congress API
  congressApiKey: process.env.CONGRESS_API_KEY || '',

  // FedDocMCP
  fedDocMcpPath: process.env.FEDDOC_MCP_PATH || './packages/feddoc-mcp/src/server.py',
  fedDocMcpEnabled: process.env.FEDDOC_MCP_ENABLED === 'true',

  // Redis (optional)
  redisUrl: process.env.REDIS_URL,

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

/**
 * Validates required environment variables at startup
 */
export function validateConfig() {
  const errors: string[] = [];

  if (!config.congressApiKey && config.fedDocMcpEnabled) {
    errors.push('CONGRESS_API_KEY is required when FedDocMCP is enabled');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
