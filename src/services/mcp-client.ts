/**
 * FedDocMCP Client Service
 *
 * v0.1: Uses Congress.gov API directly as FedDocMCP server is not yet implemented
 * Future: Will connect to FedDocMCP server via MCP protocol
 */

import { config } from '@/lib/config';
import type {
  BillText,
  BillStatus,
  BillMetadata,
  SearchBillsParams,
  SearchBillsResult,
} from '@/lib/types';

export class FedDocMCPClient {
  private baseUrl = 'https://api.congress.gov/v3';
  private apiKey: string;

  constructor() {
    this.apiKey = config.congressApiKey;
    if (!this.apiKey) {
      throw new Error('CONGRESS_API_KEY is required');
    }
  }

  /**
   * Search for bills
   */
  async searchBills(params: SearchBillsParams): Promise<SearchBillsResult> {
    const { query, congress, fromDateTime, toDateTime, limit = 20, offset = 0 } = params;

    const url = new URL(`${this.baseUrl}/bill`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('offset', offset.toString());

    if (congress) {
      url.pathname = `${this.baseUrl}/bill/${congress}`;
    }

    if (fromDateTime) {
      url.searchParams.set('fromDateTime', fromDateTime);
    }

    if (toDateTime) {
      url.searchParams.set('toDateTime', toDateTime);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Congress.gov API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      bills: data.bills?.map((bill: any) => this.normalizeBillMetadata(bill)) || [],
      pagination: {
        count: data.pagination?.count || 0,
        next: data.pagination?.next,
        previous: data.pagination?.previous,
      },
    };
  }

  /**
   * Get bill text
   */
  async getBillText(congress: number, billType: string, billNumber: number): Promise<BillText> {
    const url = `${this.baseUrl}/bill/${congress}/${billType}/${billNumber}/text?api_key=${this.apiKey}&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Congress.gov API error: ${response.statusText}`);
    }

    const data = await response.json();
    const textVersions = data.textVersions || [];

    // Get the most recent text version
    const latestVersion = textVersions[0];
    if (!latestVersion) {
      throw new Error('No text available for this bill');
    }

    // Fetch the actual text content
    const textUrl = latestVersion.formats?.find((f: any) => f.type === 'Formatted Text')?.url;
    if (!textUrl) {
      throw new Error('No text format available');
    }

    const textResponse = await fetch(`${textUrl}?api_key=${this.apiKey}`);
    const text = await textResponse.text();

    const billId = `${congress}/${billType}/${billNumber}`;

    return {
      id: billId,
      congress,
      billType,
      billNumber,
      title: data.bill?.title || `${billType.toUpperCase()} ${billNumber}`,
      text,
      format: 'text',
      metadata: this.normalizeBillMetadata(data.bill || {}),
    };
  }

  /**
   * Get bill status and actions
   */
  async getBillStatus(congress: number, billType: string, billNumber: number): Promise<BillStatus> {
    const url = `${this.baseUrl}/bill/${congress}/${billType}/${billNumber}?api_key=${this.apiKey}&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Congress.gov API error: ${response.statusText}`);
    }

    const data = await response.json();
    const bill = data.bill;

    const billId = `${congress}/${billType}/${billNumber}`;

    return {
      id: billId,
      title: bill?.title || `${billType.toUpperCase()} ${billNumber}`,
      status: bill?.latestAction?.text || 'Unknown',
      actions: bill?.actions?.map((action: any) => ({
        actionDate: action.actionDate,
        text: action.text,
        actionCode: action.actionCode,
      })) || [],
      metadata: this.normalizeBillMetadata(bill || {}),
    };
  }

  /**
   * Get basic bill information (lighter weight than full text)
   */
  async getBill(congress: number, billType: string, billNumber: number): Promise<BillMetadata> {
    const url = `${this.baseUrl}/bill/${congress}/${billType}/${billNumber}?api_key=${this.apiKey}&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Congress.gov API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeBillMetadata(data.bill || {});
  }

  /**
   * Normalize bill metadata from Congress.gov API
   */
  private normalizeBillMetadata(bill: any): BillMetadata {
    return {
      congress: bill.congress,
      billType: bill.type,
      billNumber: bill.number,
      title: bill.title || '',
      sponsor: bill.sponsors?.[0]?.fullName,
      introducedDate: bill.introducedDate,
      status: bill.latestAction?.text,
      latestAction: bill.latestAction ? {
        text: bill.latestAction.text,
        actionDate: bill.latestAction.actionDate,
      } : undefined,
    };
  }

  /**
   * Connection methods for MCP protocol compatibility
   * Currently no-ops since we're using direct API calls
   * Future: Will spawn MCP server process
   */
  async connect(): Promise<void> {
    // No-op for now
    // Future: Spawn Python MCP server process
  }

  async disconnect(): Promise<void> {
    // No-op for now
    // Future: Terminate MCP server process
  }
}
