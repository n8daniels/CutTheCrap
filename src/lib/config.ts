// Configuration and environment variables
export const config = {
  // Congress API
  congressApiKey: process.env.CONGRESS_API_KEY || '',

  // FedDocMCP
  fedDocMcpPath: process.env.FEDDOC_MCP_PATH || './packages/feddoc-mcp/src/server.py',
  fedDocMcpEnabled: process.env.FEDDOC_MCP_ENABLED === 'true',

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiOrgId: process.env.OPENAI_ORG_ID || '',

  // CutTheCrapLLM
  cutTheCrapModelId: process.env.CUTTHECRAP_MODEL_ID || 'gpt-4',
  trainingMode: process.env.CUTTHECRAP_TRAINING_MODE === 'true',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Cache
  redisUrl: process.env.REDIS_URL || '',
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '86400'),

  // Training
  trainingDataDir: process.env.TRAINING_DATA_DIR || './data/training',
  maxTrainingExamples: parseInt(process.env.MAX_TRAINING_EXAMPLES || '100000'),
  minFeedbackScore: parseInt(process.env.MIN_FEEDBACK_SCORE || '4'),
};

// Validate required environment variables
export function validateConfig() {
  const errors: string[] = [];

  if (!config.congressApiKey && config.fedDocMcpEnabled) {
    errors.push('CONGRESS_API_KEY is required when FedDocMCP is enabled');
  }

  if (!config.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors.join(', '));
  }

  return errors.length === 0;
}
