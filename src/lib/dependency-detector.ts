/**
 * Dependency Detector - Identifies references to other documents in bill text
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
  /**
   * Extract all dependencies from bill text
   */
  extractDependencies(text: string): Dependency[] {
    const dependencies: Dependency[] = [];
    const seen = new Set<string>();

    // Extract bills
    const billMatches = text.matchAll(REFERENCE_PATTERNS.bill);
    for (const match of billMatches) {
      const id = `bill:${match[0]}`;
      if (!seen.has(id)) {
        seen.add(id);
        dependencies.push({
          id,
          type: 'bill',
          referenceText: match[0],
          relationship: 'Referenced bill',
        });
      }
    }

    // Extract USC references
    const uscMatches = text.matchAll(REFERENCE_PATTERNS.usc);
    for (const match of uscMatches) {
      const id = `usc:${match[1]}-${match[2]}`;
      if (!seen.has(id)) {
        seen.add(id);
        dependencies.push({
          id,
          type: 'usc_section',
          referenceText: match[0],
          relationship: 'Referenced US Code section',
        });
      }
    }

    // Extract CFR references
    const cfrMatches = text.matchAll(REFERENCE_PATTERNS.cfr);
    for (const match of cfrMatches) {
      const id = `cfr:${match[1]}-${match[2]}`;
      if (!seen.has(id)) {
        seen.add(id);
        dependencies.push({
          id,
          type: 'cfr_section',
          referenceText: match[0],
          relationship: 'Referenced CFR section',
        });
      }
    }

    // Extract public laws
    const publicLawMatches = text.matchAll(REFERENCE_PATTERNS.publicLaw);
    for (const match of publicLawMatches) {
      const id = `pl:${match[1]}-${match[2]}`;
      if (!seen.has(id)) {
        seen.add(id);
        dependencies.push({
          id,
          type: 'public_law',
          referenceText: match[0],
          relationship: 'Referenced public law',
        });
      }
    }

    // Extract amendments
    const amendmentMatches = text.matchAll(REFERENCE_PATTERNS.amendment);
    for (const match of amendmentMatches) {
      const id = `amendment:${match[1]}`;
      if (!seen.has(id)) {
        seen.add(id);
        dependencies.push({
          id,
          type: 'amendment',
          referenceText: match[0],
          relationship: 'Referenced amendment',
        });
      }
    }

    return dependencies;
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
