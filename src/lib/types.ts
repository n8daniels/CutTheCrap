/**
 * Core types for bill data and MCP integration
 */

export interface BillMetadata {
  congress: number;
  billType: string;
  billNumber: number;
  title: string;
  sponsor?: string;
  introducedDate?: string;
  status?: string;
  latestAction?: {
    text: string;
    actionDate: string;
  };
  [key: string]: unknown;
}

export interface BillText {
  id: string;
  congress: number;
  billType: string;
  billNumber: number;
  title: string;
  text: string;
  format: 'text' | 'xml' | 'json' | 'pdf';
  metadata: BillMetadata;
}

export interface BillStatus {
  id: string;
  title: string;
  status: string;
  actions: Array<{
    actionDate: string;
    text: string;
    actionCode?: string;
  }>;
  metadata: BillMetadata;
}

export interface SearchBillsParams {
  query?: string;
  congress?: number;
  fromDateTime?: string;
  toDateTime?: string;
  limit?: number;
  offset?: number;
}

export interface SearchBillsResult {
  bills: BillMetadata[];
  pagination: {
    count: number;
    next?: string;
    previous?: string;
  };
}
