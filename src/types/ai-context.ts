/**
 * Types for AI context building and optimization
 */

import { DocumentType, BillMetadata } from './document';

export interface AIContext {
  primaryBill: {
    id: string;
    title: string;
    fullText: string;
    metadata: BillMetadata;
  };
  dependencies: DependencySummary[];
  crossReferences: CrossReference[];
  timeline: TimelineEvent[];
  metadata: ContextMetadata;
}

export interface DependencySummary {
  id: string;
  type: DocumentType;
  title: string;
  summary: string;           // NOT full text (save tokens)
  relevantSections?: string[]; // Only sections referenced
  relationship: string;       // How it relates to primary
  metadata: any;
}

export interface CrossReference {
  from: string;
  to: string;
  context: string;            // Why this reference exists
}

export interface TimelineEvent {
  date: string;
  event: string;
  document: string;
}

export interface ContextMetadata {
  documentsIncluded: number;
  dependencyDepth: number;
  cacheHits: number;
  cacheMisses: number;
  fetchTimeMs: number;
  totalTokensEstimate: number;
  generatedAt: string;
  expiresAt: string;
}
