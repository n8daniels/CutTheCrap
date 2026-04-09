/**
 * Application configuration
 * Validates and exports environment variables
 *
 * SECURITY: API keys are validated for format and functionality
 * See: docs/security/API_KEY_SECURITY.md
 */

export const config = {
  // Congress API
  congressApiKey: process.env.CONGRESS_API_KEY || '',

  // FEC API
  fecApiKey: process.env.FEC_API_KEY || '',

  // Google Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Hugging Face (free fallback for AI summaries)
  huggingfaceToken: process.env.HUGGINGFACE_TOKEN || '',

  // FedDocMCP
  fedDocMcpPath: process.env.FEDDOC_MCP_PATH || './packages/feddoc-mcp/src/server.py',
  fedDocMcpEnabled: process.env.FEDDOC_MCP_ENABLED === 'true',

  // Redis (optional)
  redisUrl: process.env.REDIS_URL,

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

/**
 * Validates Congress.gov API key format
 *
 * SECURITY: Ensures API key meets expected format before use
 * Congress.gov API keys are typically alphanumeric with specific patterns
 */
export function validateCongressApiKeyFormat(apiKey: string): boolean {
  // Must be non-empty
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  // Must be reasonable length (Congress.gov keys are typically 32-40 chars)
  if (apiKey.length < 10 || apiKey.length > 100) {
    console.warn(`[SECURITY] API key length suspicious: ${apiKey.length} chars`);
    return false;
  }

  // Must not be a placeholder value
  const placeholders = [
    'your_api_key_here',
    'your_congress_api_key_here',
    'paste_your_api_key_here',
    'paste_your_key_here',
    'changeme',
    'replace_me',
    'example',
    'test',
    'demo',
  ];

  const lowerKey = apiKey.toLowerCase();
  if (placeholders.some(p => lowerKey.includes(p))) {
    console.error('[SECURITY] API key appears to be a placeholder value');
    return false;
  }

  // Must not contain obviously invalid characters
  if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\t')) {
    console.error('[SECURITY] API key contains whitespace');
    return false;
  }

  return true;
}

/**
 * Tests Congress.gov API key by making a test request
 *
 * SECURITY: Validates API key works before application starts accepting requests
 * Prevents runtime failures due to invalid/expired keys
 */
export async function testCongressApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) {
    return false;
  }

  try {
    // Make a minimal API request to validate key
    const response = await fetch(
      `https://api.congress.gov/v3/bill/118?api_key=${apiKey}&format=json&limit=1`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );

    if (response.ok) {
      console.log('[SECURITY] Congress.gov API key validated successfully');
      return true;
    } else if (response.status === 401 || response.status === 403) {
      console.error('[SECURITY] Congress.gov API key authentication failed:', response.status);
      return false;
    } else {
      console.warn('[SECURITY] Congress.gov API test returned unexpected status:', response.status);
      // Allow through - might be temporary API issue
      return true;
    }
  } catch (error) {
    console.warn('[SECURITY] Congress.gov API key test failed (network issue):', error);
    // Allow through - might be network issue, don't block startup
    return true;
  }
}

/**
 * Validates required environment variables at startup
 *
 * SECURITY: Enhanced validation with format checks and optional test API call
 */
export async function validateConfig(options: { testApiKey?: boolean } = {}): Promise<void> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if CONGRESS_API_KEY is required and present
  if (!config.congressApiKey && config.fedDocMcpEnabled) {
    errors.push('CONGRESS_API_KEY is required when FedDocMCP is enabled');
    errors.push('Get your API key at: https://api.congress.gov/sign-up/');
  }

  // Validate CONGRESS_API_KEY format if present
  if (config.congressApiKey) {
    if (!validateCongressApiKeyFormat(config.congressApiKey)) {
      errors.push('CONGRESS_API_KEY format validation failed');
      errors.push('Check that your API key is correct and not a placeholder value');
    } else if (options.testApiKey) {
      // Optional: Test API key actually works
      console.log('[SECURITY] Testing Congress.gov API key...');
      const isValid = await testCongressApiKey(config.congressApiKey);
      if (!isValid) {
        errors.push('CONGRESS_API_KEY authentication failed - key may be invalid or expired');
        errors.push('Visit https://api.congress.gov/sign-up/ to get a new key');
      }
    }
  }

  // Check for removed OPENAI_API_KEY (no longer used)
  if (process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY is set but not currently used by the application');
    warnings.push('Remove it from .env to reduce attack surface');
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('[CONFIG] Warnings:\n' + warnings.map(w => `  - ${w}`).join('\n'));
  }

  // Throw on errors
  if (errors.length > 0) {
    throw new Error(`[CONFIG] Configuration errors:\n${errors.map(e => `  ❌ ${e}`).join('\n')}`);
  }

  console.log('[CONFIG] ✅ Configuration validation passed');
}
