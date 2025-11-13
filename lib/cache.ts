import { createHash } from 'crypto';
import { query } from './db';
import { AnalysisType } from '@/types';

/**
 * Generate SHA-256 hash of content for caching
 */
export function generateContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Check if cached analysis exists for content
 */
export async function getCachedAnalysis<T = Record<string, unknown>>(
  content: string,
  analysisType: AnalysisType
): Promise<T | null> {
  if (process.env.ENABLE_CONTENT_CACHE !== 'true') {
    return null;
  }

  const contentHash = generateContentHash(content);

  try {
    const result = await query<{ result: T }>(
      `SELECT result
       FROM content_cache
       WHERE content_hash = $1
         AND analysis_type = $2
         AND expires_at > CURRENT_TIMESTAMP`,
      [contentHash, analysisType]
    );

    if (result.rows.length > 0) {
      return result.rows[0].result;
    }

    return null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

/**
 * Store analysis result in cache
 */
export async function setCachedAnalysis(
  content: string,
  analysisType: AnalysisType,
  result: Record<string, unknown>
): Promise<void> {
  if (process.env.ENABLE_CONTENT_CACHE !== 'true') {
    return;
  }

  const contentHash = generateContentHash(content);
  const ttlHours = parseInt(process.env.CACHE_TTL_HOURS || '24');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  try {
    await query(
      `INSERT INTO content_cache (content_hash, content, analysis_type, result, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (content_hash)
       DO UPDATE SET
         result = EXCLUDED.result,
         expires_at = EXCLUDED.expires_at,
         created_at = CURRENT_TIMESTAMP`,
      [contentHash, content, analysisType, JSON.stringify(result), expiresAt]
    );
  } catch (error) {
    console.error('Cache storage error:', error);
    // Don't throw - caching failures shouldn't break the application
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const result = await query(
      'DELETE FROM content_cache WHERE expires_at < CURRENT_TIMESTAMP'
    );

    return result.rowCount || 0;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}
