// Document Types
export type DocumentType =
  | 'bill'
  | 'amendment'
  | 'committee_report'
  | 'referenced_law'
  | 'public_law'
  | 'usc_section'
  | 'cfr_section';

// Document Node for Graph
export interface DocumentNode {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  metadata: {
    sponsor?: string;
    introduced_date?: string;
    status?: string;
    congress?: number;
    bill_type?: string;
    bill_number?: number;
    [key: string]: any;
  };
  dependencies: DocumentNode[];
  relationship?: string;
}

// Document Graph
export interface DocumentGraph {
  root: DocumentNode;
  nodes: Map<string, DocumentNode>;
  totalNodes: number;
  maxDepth: number;
  fetchTimeMs: number;
  cacheHits: number;
  cacheMisses: number;
}

// AI Context for Training
export interface AIContext {
  primaryBill: {
    id: string;
    title: string;
    fullText: string;
    metadata: any;
  };
  dependencies: {
    id: string;
    type: DocumentType;
    title: string;
    summary: string;
    relevantSections: string[];
    relationship: string;
    metadata: any;
  }[];
  crossReferences: {
    from: string;
    to: string;
    context: string;
  }[];
  timeline: {
    date: string;
    event: string;
    document: string;
  }[];
  metadata: {
    documentsIncluded: number;
    dependencyDepth: number;
    cacheHits: number;
    fetchTimeMs: number;
    totalTokensEstimate: number;
  };
}

// Training Data
export interface TrainingExample {
  input: string;
  context: AIContext;
  output: string;
  metadata: {
    billId: string;
    documentsIncluded: number;
    timestamp: string;
    userFeedback?: 'helpful' | 'not_helpful' | number;
    modelVersion?: string;
  };
}

// Fine-tuning Format (OpenAI JSONL)
export interface FineTuningExample {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

// Bill Search Parameters
export interface SearchBillsParams {
  query?: string;
  congress?: number;
  bill_type?: string;
  sponsor?: string;
  status?: string;
  limit?: number;
}

// Bill Data from Congress API
export interface BillData {
  id: string;
  congress: number;
  bill_type: string;
  bill_number: number;
  title: string;
  sponsor?: string;
  introduced_date?: string;
  status?: string;
  summary?: string;
  text?: string;
  amendments?: any[];
  related_bills?: any[];
}

// Cache Stats
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}
