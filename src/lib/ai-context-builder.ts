/**
 * AI Context Builder - Optimizes document graphs for AI consumption
 */

import { DocumentGraph, DocumentNode } from '@/types/document';
import {
  AIContext,
  DependencySummary,
  CrossReference,
  TimelineEvent,
  ContextMetadata,
} from '@/types/ai-context';

export class AIContextBuilder {
  /**
   * Build AI-optimized context from document graph
   */
  buildContext(graph: DocumentGraph): AIContext {
    return {
      primaryBill: this.formatPrimaryBill(graph.root),
      dependencies: this.formatDependencies(graph.nodes, graph.root.id),
      crossReferences: this.buildCrossReferences(graph),
      timeline: this.buildTimeline(graph),
      metadata: this.buildMetadata(graph),
    };
  }

  /**
   * Format primary bill data
   */
  private formatPrimaryBill(root: DocumentNode) {
    return {
      id: root.id,
      title: root.title,
      fullText: root.content,
      metadata: root.metadata,
    };
  }

  /**
   * Format dependencies with smart summarization
   */
  private formatDependencies(
    nodes: Map<string, DocumentNode>,
    rootId: string
  ): DependencySummary[] {
    const dependencies: DependencySummary[] = [];

    for (const [id, node] of nodes.entries()) {
      if (id === rootId) continue; // Skip root

      dependencies.push({
        id: node.id,
        type: node.type,
        title: node.title,
        summary: this.summarizeContent(node.content),
        relevantSections: this.extractRelevantSections(node.content),
        relationship: node.relationship || 'Related document',
        metadata: node.metadata,
      });
    }

    return dependencies;
  }

  /**
   * Summarize content to save tokens (80% reduction)
   */
  private summarizeContent(content: string, maxLength: number = 500): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Extract first few paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    let summary = '';

    for (const para of paragraphs) {
      if (summary.length + para.length > maxLength) {
        break;
      }
      summary += para + '\n\n';
    }

    return summary.trim() + '...';
  }

  /**
   * Extract relevant sections from document
   */
  private extractRelevantSections(content: string): string[] {
    const sections: string[] = [];
    const sectionPattern = /(?:Section|§)\s+(\d+[a-z]?(?:\([a-z0-9]+\))?)/gi;
    const matches = content.matchAll(sectionPattern);

    for (const match of matches) {
      if (sections.length >= 10) break; // Limit to 10 sections
      sections.push(match[0]);
    }

    return sections;
  }

  /**
   * Build cross-reference map
   */
  private buildCrossReferences(graph: DocumentGraph): CrossReference[] {
    const refs: CrossReference[] = [];

    const traverse = (node: DocumentNode) => {
      for (const dep of node.dependencies) {
        refs.push({
          from: node.id,
          to: dep.id,
          context: dep.relationship || 'References',
        });

        traverse(dep);
      }
    };

    traverse(graph.root);

    return refs;
  }

  /**
   * Build timeline of events
   */
  private buildTimeline(graph: DocumentGraph): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    for (const [id, node] of graph.nodes.entries()) {
      if (node.metadata.introduced_date) {
        events.push({
          date: node.metadata.introduced_date,
          event: 'Introduced',
          document: id,
        });
      }

      if (node.metadata.last_action_date) {
        events.push({
          date: node.metadata.last_action_date,
          event: node.metadata.last_action || 'Action taken',
          document: id,
        });
      }
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  }

  /**
   * Build context metadata
   */
  private buildMetadata(graph: DocumentGraph): ContextMetadata {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 86400000); // 24 hours

    return {
      documentsIncluded: graph.totalNodes,
      dependencyDepth: graph.maxDepth,
      cacheHits: graph.cacheHits,
      cacheMisses: graph.cacheMisses,
      fetchTimeMs: graph.fetchTimeMs,
      totalTokensEstimate: this.estimateTokens(graph),
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(graph: DocumentGraph): number {
    let totalChars = 0;

    for (const [, node] of graph.nodes.entries()) {
      totalChars += node.content.length;
    }

    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(totalChars / 4);
  }
}
