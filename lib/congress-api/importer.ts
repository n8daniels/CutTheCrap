import { congressApi, CongressApiClient } from './client';
import { ollamaClient } from '@/lib/llm/ollama';
import { generateContentHash } from '@/lib/cache';
import { AnalysisType, BillStatus, Chamber } from '@/types';

/**
 * Bill Import Service
 * Handles importing bills from Congress.gov and triggering analysis
 *
 * Note: This runs server-side only and requires Congress.gov API key
 */

export interface ImportOptions {
  congress: number;
  limit?: number;
  includeText?: boolean;
  autoAnalyze?: boolean;
}

export interface ImportResult {
  success: boolean;
  billsImported: number;
  billsFailed: number;
  errors: string[];
}

export class BillImporter {
  private api: CongressApiClient;

  constructor() {
    this.api = congressApi;
  }

  /**
   * Import bills from current congress (118th)
   */
  async importCurrentCongress(options?: Partial<ImportOptions>): Promise<ImportResult> {
    return this.importBills({
      congress: 118,
      limit: 20, // Start small
      includeText: false, // Text parsing is complex, handle separately
      autoAnalyze: false, // Analysis happens via queue
      ...options,
    });
  }

  /**
   * Import a specific bill by number
   * Returns bill data without saving (for preview/analysis queue)
   */
  async fetchBillData(billNumber: string, congress: number): Promise<any> {
    const parsed = CongressApiClient.parseBillNumber(billNumber, congress);

    if (!parsed) {
      throw new Error('Invalid bill number format');
    }

    // Fetch bill details
    const billDetails = await this.api.getBillDetails(parsed.congress, parsed.type, parsed.number);

    if (!billDetails) {
      throw new Error('Bill not found');
    }

    // Fetch bill text
    const billText = await this.api.getBillText(parsed.congress, parsed.type, parsed.number);

    return {
      details: billDetails,
      text: billText,
      parsed,
    };
  }

  /**
   * Import multiple bills from Congress.gov
   * Returns data for batch processing (doesn't save directly)
   */
  async importBills(options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      billsImported: 0,
      billsFailed: 0,
      errors: [],
    };

    try {
      // Check API key
      if (!this.api.isConfigured()) {
        throw new Error('Congress.gov API key not configured. Set CONGRESS_GOV_API_KEY environment variable.');
      }

      // Fetch bills from API
      const bills = await this.api.getBills(options.congress, {
        limit: options.limit || 20,
      });

      console.log(`Fetched ${bills.length} bills from Congress ${options.congress}`);

      // Return the bill data for processing
      // The actual import happens via API routes with Supabase
      result.billsImported = bills.length;
      result.success = true;

    } catch (error) {
      console.error('Error in importBills:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Map Congress.gov status to our BillStatus enum
   */
  mapBillStatus(actionText: string): BillStatus {
    const text = actionText.toLowerCase();

    if (text.includes('became law') || text.includes('became public law')) {
      return BillStatus.BECAME_LAW;
    }
    if (text.includes('vetoed')) {
      return BillStatus.VETOED;
    }
    if (text.includes('signed by president') || text.includes('presented to president')) {
      return BillStatus.SIGNED;
    }
    if (text.includes('passed senate') && text.includes('passed house')) {
      return BillStatus.PASSED_BOTH;
    }
    if (text.includes('passed senate')) {
      return BillStatus.PASSED_SENATE;
    }
    if (text.includes('passed house')) {
      return BillStatus.PASSED_HOUSE;
    }
    if (text.includes('committee')) {
      return BillStatus.IN_COMMITTEE;
    }

    return BillStatus.INTRODUCED;
  }

  /**
   * Map chamber string to Chamber enum
   */
  mapChamber(chamber: string): Chamber {
    if (chamber?.toLowerCase().includes('senate')) {
      return Chamber.SENATE;
    }
    if (chamber?.toLowerCase().includes('house')) {
      return Chamber.HOUSE;
    }
    return Chamber.HOUSE; // Default
  }

  /**
   * Parse bill text into sections
   * Returns array of sections for saving
   */
  parseSections(billText: string): Array<{
    sectionNumber: string;
    title: string;
    content: string;
    contentHash: string;
  }> {
    const sections = [];

    // Simple section parsing based on "SEC. X" or "SECTION X" markers
    const sectionRegex = /(?:SEC\.|SECTION)\s+(\d+[A-Z]?)\.\s+(.+?)(?=(?:SEC\.|SECTION)\s+\d+|$)/gis;

    const matches = billText.matchAll(sectionRegex);

    for (const match of matches) {
      const sectionNumber = match[1];
      const sectionText = match[2].trim();

      // Extract title (usually the first line)
      const lines = sectionText.split('\n');
      const title = lines[0].trim() || `Section ${sectionNumber}`;
      const content = sectionText;

      // Generate content hash for caching
      const contentHash = generateContentHash(content);

      sections.push({
        sectionNumber,
        title: title.substring(0, 500),
        content,
        contentHash,
      });
    }

    return sections;
  }
}

// Singleton instance
export const billImporter = new BillImporter();
