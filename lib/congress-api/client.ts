/**
 * Congress.gov API Client
 *
 * API Documentation: https://api.congress.gov/
 * Get your API key at: https://api.congress.gov/sign-up/
 */

interface CongressBill {
  congress: number;
  type: string; // 'hr', 's', 'hjres', 'sjres', etc.
  number: string;
  title: string;
  introducedDate: string;
  updateDate: string;
  originChamber: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  sponsors?: Array<{
    bioguideId: string;
    fullName: string;
    party: string;
    state: string;
  }>;
}

interface BillTextResponse {
  textVersions: Array<{
    type: string;
    date: string;
    formats: Array<{
      type: string;
      url: string;
    }>;
  }>;
}

export class CongressApiClient {
  private apiKey: string;
  private baseUrl = 'https://api.congress.gov/v3';

  constructor() {
    this.apiKey = process.env.CONGRESS_GOV_API_KEY || '';

    if (!this.apiKey) {
      console.warn('CONGRESS_GOV_API_KEY not set. Congress.gov API features will not work.');
    }
  }

  /**
   * Fetch bills from a specific congress
   */
  async getBills(congress: number, options?: {
    limit?: number;
    offset?: number;
    sort?: 'updateDate+desc' | 'updateDate+asc';
  }): Promise<CongressBill[]> {
    const { limit = 250, offset = 0, sort = 'updateDate+desc' } = options || {};

    const url = new URL(`${this.baseUrl}/bill/${congress}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('offset', offset.toString());
    url.searchParams.set('sort', sort);
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Congress API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.bills || [];
  }

  /**
   * Fetch details for a specific bill
   */
  async getBillDetails(congress: number, type: string, number: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/bill/${congress}/${type}/${number}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Congress API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.bill;
  }

  /**
   * Fetch bill text (full legislative text)
   */
  async getBillText(congress: number, type: string, number: string): Promise<string | null> {
    try {
      const url = new URL(`${this.baseUrl}/bill/${congress}/${type}/${number}/text`);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('format', 'json');

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error(`Failed to fetch bill text: ${response.statusText}`);
        return null;
      }

      const data: BillTextResponse = await response.json();

      // Get the most recent text version
      if (data.textVersions && data.textVersions.length > 0) {
        const latestVersion = data.textVersions[0];

        // Find plain text format
        const txtFormat = latestVersion.formats.find(f => f.type === 'Formatted Text');

        if (txtFormat) {
          // Fetch the actual text content
          const textResponse = await fetch(txtFormat.url);
          return await textResponse.text();
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching bill text:', error);
      return null;
    }
  }

  /**
   * Fetch actions taken on a bill
   */
  async getBillActions(congress: number, type: string, number: string): Promise<any[]> {
    const url = new URL(`${this.baseUrl}/bill/${congress}/${type}/${number}/actions`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Congress API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.actions || [];
  }

  /**
   * Fetch cosponsors of a bill
   */
  async getBillCosponsors(congress: number, type: string, number: string): Promise<any[]> {
    const url = new URL(`${this.baseUrl}/bill/${congress}/${type}/${number}/cosponsors`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Congress API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cosponsors || [];
  }

  /**
   * Parse bill number into components
   * e.g., "H.R. 1234" -> { congress: 118, type: 'hr', number: '1234' }
   */
  static parseBillNumber(billNumber: string, congress: number): { congress: number; type: string; number: string } | null {
    // Match patterns like "H.R. 123", "S. 456", "H.J.Res. 78", etc.
    const match = billNumber.match(/^([HS])\.?(J\.?Res\.?|Con\.?Res\.?|Res\.?|R\.)?\.?\s*(\d+)$/i);

    if (!match) {
      return null;
    }

    const chamber = match[1].toUpperCase();
    const resolutionType = match[2] ? match[2].replace(/\./g, '').toLowerCase() : 'r';
    const num = match[3];

    // Map to API types
    const typeMap: Record<string, string> = {
      'hr': 'hr',
      'r': 'hr',
      's': 's',
      'hjres': 'hjres',
      'jres': 'hjres',
      'sjres': 'sjres',
      'hconres': 'hconres',
      'conres': 'hconres',
      'sconres': 'sconres',
      'hres': 'hres',
      'res': chamber === 'H' ? 'hres' : 'sres',
      'sres': 'sres',
    };

    const type = typeMap[resolutionType.toLowerCase()] || (chamber === 'H' ? 'hr' : 's');

    return {
      congress,
      type,
      number: num,
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }
}

// Singleton instance
export const congressApi = new CongressApiClient();
