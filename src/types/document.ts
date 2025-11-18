/**
 * Core types for document graph and federal legislation processing
 */

export type DocumentType =
  | 'bill'
  | 'amendment'
  | 'committee_report'
  | 'referenced_law'
  | 'public_law'
  | 'usc_section'
  | 'cfr_section';

export interface BillMetadata {
  sponsor?: string;
  introduced_date?: string;
  status?: string;
  congress?: number;
  bill_type?: string;
  bill_number?: number;
  [key: string]: any;
}

export interface DocumentNode {
  id: string;                    // e.g., "117/hr/3684"
  type: DocumentType;
  title: string;
  content: string;               // Full text or summary
  metadata: BillMetadata;
  dependencies: DocumentNode[];  // Related documents
  relationship?: string;          // How this relates to parent
}

export interface DocumentGraph {
  root: DocumentNode;            // Primary document
  nodes: Map<string, DocumentNode>;  // All nodes indexed by ID
  totalNodes: number;
  maxDepth: number;
  fetchTimeMs: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface Dependency {
  id: string;
  type: DocumentType;
  referenceText: string;
  relationship: string;
}

export interface Bill {
  id: string;
  congress: number;
  bill_type: string;
  bill_number: number;
  title: string;
  text: string;
  metadata: BillMetadata;
}

export interface BillText {
  id: string;
  text: string;
  format: 'html' | 'xml' | 'txt';
}

export interface BillStatus {
  id: string;
  status: string;
  last_action: string;
  last_action_date: string;
}

export interface SearchBillsParams {
  query?: string;
  congress?: number;
  status?: string;
  limit?: number;
  offset?: number;
}
