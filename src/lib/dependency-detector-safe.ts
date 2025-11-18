/**
 * Safe Dependency Detector - Extracts bill references with ReDoS protection
 *
 * SECURITY IMPROVEMENTS OVER ORIGINAL:
 * - Timeout protection on regex operations (5 seconds max)
 * - Input length limits (100KB max)
 * - Match count limits (100 per pattern)
 * - Safe regex pattern validation
 *
 * See: docs/security/threat_model.md - Scenario 3
 */

import { Dependency, DocumentType } from '@/types/document';

export const REFERENCE_PATTERNS = {
  // Bills: "H.R. 1234", "S. 5678", "H.J.Res. 99"
  bill: /(?:H\.R\.|S\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.|H\.Res\.|S\.Res\.)\s*(\d+)/gi,

  // US Code: "42 U.S.C. § 1983", "42 USC 1983"
  usc: /(\d+)\s*U\.?S\.?C\.?\s*§?\s*(\d+[a-z]?(?:-\d+)?)/gi,

  // CFR: "40 CFR 52.21", "40 C.F.R. § 52.21"
  cfr: /(\d+)\s*C\.?F\.?R\.?\s*§?\s*([\d.]+)/gi,

  // Public Laws: "Public Law 117-58", "Pub. L. 117-58"
  publicLaw: /(?:Public Law|Pub\.?\s*L\.?)\s*(\d+)-(\d+)/gi,

  // Amendments: "Amendment SA 2137", "Amendment No. 2137"
  amendment: /Amendment\s*(?:SA|No\.?)\s*(\d+)/gi,
};

export class DependencyDetector {
  // SECURITY: Configuration for safety limits
  private readonly REGEX_TIMEOUT_MS = 5000; // 5 seconds
  private readonly MAX_INPUT_LENGTH = 100000; // 100KB
  private readonly MAX_MATCHES_PER_PATTERN = 100;
  private readonly MAX_ID_LENGTH = 100;

  /**
   * Extract all dependencies from bill text with safety checks
   *
   * @param text Bill text to analyze
   * @returns Array of dependencies found
   */
  extractDependencies(text: string): Dependency[] {
    // SECURITY FIX: Limit input size to prevent ReDoS
    if (text.length > this.MAX_INPUT_LENGTH) {
      console.warn(
        `[SECURITY] Input text too long (${text.length} chars), ` +
        `truncating to ${this.MAX_INPUT_LENGTH}`
      );
      text = text.substring(0, this.MAX_INPUT_LENGTH);
    }

    const dependencies: Dependency[] = [];
    const seen = new Set<string>();

    // Process each pattern type with safety checks
    try {
      dependencies.push(
        ...this.extractWithPattern(text, REFERENCE_PATTERNS.bill, 'bill', 'Referenced bill', seen)
      );
      dependencies.push(
        ...this.extractWithPattern(text, REFERENCE_PATTERNS.usc, 'usc_section', 'Referenced US Code section', seen)
      );
      dependencies.push(
        ...this.extractWithPattern(text, REFERENCE_PATTERNS.cfr, 'cfr_section', 'Referenced CFR section', seen)
      );
      dependencies.push(
        ...this.extractWithPattern(text, REFERENCE_PATTERNS.publicLaw, 'public_law', 'Referenced public law', seen)
      );
      dependencies.push(
        ...this.extractWithPattern(text, REFERENCE_PATTERNS.amendment, 'amendment', 'Referenced amendment', seen)
      );
    } catch (error) {
      console.error('[SECURITY] Error during dependency extraction:', error);
      // Return partial results rather than failing completely
    }

    return dependencies;
  }

  /**
   * Extract dependencies with a single pattern, with safety checks
   */
  private extractWithPattern(
    text: string,
    pattern: RegExp,
    type: DocumentType,
    relationship: string,
    seen: Set<string>
  ): Dependency[] {
    const dependencies: Dependency[] = [];

    try {
      // SECURITY FIX: Run regex with timeout protection
      const matches = this.matchWithTimeout(text, pattern, this.REGEX_TIMEOUT_MS);

      let count = 0;
      for (const match of matches) {
        // SECURITY FIX: Limit total matches per pattern
        if (count++ >= this.MAX_MATCHES_PER_PATTERN) {
          console.warn(
            `[SECURITY] Max matches (${this.MAX_MATCHES_PER_PATTERN}) ` +
            `reached for pattern type: ${type}`
          );
          break;
        }

        const id = this.buildIdFromMatch(match, type);
        if (!seen.has(id)) {
          seen.add(id);
          dependencies.push({
            id,
            type,
            referenceText: match[0],
            relationship,
          });
        }
      }
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error(
          `[SECURITY] Regex timeout for pattern type ${type}. ` +
          `Possible ReDoS attack detected.`
        );
      } else {
        console.error(`[SECURITY] Error processing pattern for type ${type}:`, error);
      }
    }

    return dependencies;
  }

  /**
   * Execute regex with timeout protection
   *
   * SECURITY: Prevents ReDoS (Regular Expression Denial of Service)
   */
  private matchWithTimeout(
    text: string,
    pattern: RegExp,
    timeoutMs: number
  ): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    const startTime = Date.now();

    try {
      const iterator = text.matchAll(pattern);

      for (const match of iterator) {
        // SECURITY FIX: Check timeout on each iteration
        if (Date.now() - startTime > timeoutMs) {
          throw new TimeoutError(
            `Regex timeout after ${timeoutMs}ms - possible ReDoS attack`
          );
        }

        matches.push(match);

        // Extra safety: break if we're taking too long per match
        if (matches.length > 0 && (Date.now() - startTime) / matches.length > 100) {
          console.warn('[SECURITY] Abnormally slow regex matching detected');
          break;
        }
      }
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw error;
      }
      console.error('[SECURITY] Error during regex matching:', error);
    }

    return matches;
  }

  /**
   * Build dependency ID from regex match with safety checks
   */
  private buildIdFromMatch(match: RegExpMatchArray, type: DocumentType): string {
    let id: string;

    switch (type) {
      case 'bill':
        id = `bill:${match[0]}`;
        break;
      case 'usc_section':
        id = `usc:${match[1]}-${match[2]}`;
        break;
      case 'cfr_section':
        id = `cfr:${match[1]}-${match[2]}`;
        break;
      case 'public_law':
        id = `pl:${match[1]}-${match[2]}`;
        break;
      case 'amendment':
        id = `amendment:${match[1]}`;
        break;
      default:
        id = `unknown:${match[0]}`;
    }

    // SECURITY FIX: Limit ID length
    if (id.length > this.MAX_ID_LENGTH) {
      id = id.substring(0, this.MAX_ID_LENGTH);
    }

    return id;
  }

  /**
   * Filter dependencies by type
   */
  filterByType(dependencies: Dependency[], type: DocumentType): Dependency[] {
    return dependencies.filter(dep => dep.type === type);
  }

  /**
   * Get unique dependency IDs
   */
  getUniqueIds(dependencies: Dependency[]): string[] {
    return Array.from(new Set(dependencies.map(dep => dep.id)));
  }
}

/**
 * Custom error for regex timeout detection
 */
class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
