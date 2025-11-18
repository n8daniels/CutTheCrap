/**
 * Document Graph Builder - Builds complete dependency graphs for bills
 *
 * SECURITY: Uses safe dependency detector with ReDoS protection
 * See: docs/security/threat_model.md - Scenario 3
 */

import { DocumentGraph, DocumentNode, Dependency } from '@/types/document';
import { FedDocMCPClient } from '@/services/mcp-client';
import { DocumentCache } from './document-cache';
import { DependencyDetector } from './dependency-detector-safe';

export class DocumentGraphBuilder {
  private dependencyDetector: DependencyDetector;

  constructor(
    private mcpClient: FedDocMCPClient,
    private cache: DocumentCache
  ) {
    this.dependencyDetector = new DependencyDetector();
  }

  /**
   * Build complete document graph for a bill
   */
  async buildGraph(billId: string, maxDepth: number = 2): Promise<DocumentGraph> {
    const startTime = Date.now();
    const visited = new Set<string>();
    const nodes = new Map<string, DocumentNode>();
    let cacheHits = 0;
    let cacheMisses = 0;

    // Check cache first
    const cacheKey = `bill:graph:${billId}:${maxDepth}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      console.log(`Cache hit for ${billId}`);
      return cached;
    }

    console.log(`Building document graph for ${billId} (max depth: ${maxDepth})`);

    try {
      // Fetch root node
      const root = await this.fetchNode(billId, 0, visited);
      nodes.set(billId, root);
      cacheMisses++;

      // Recursively fetch dependencies
      await this.fetchDependencies(root, maxDepth, 1, visited, nodes, { cacheHits, cacheMisses });

      const graph: DocumentGraph = {
        root,
        nodes,
        totalNodes: nodes.size,
        maxDepth,
        fetchTimeMs: Date.now() - startTime,
        cacheHits,
        cacheMisses,
      };

      // Cache the result
      await this.cache.set(cacheKey, graph, 86400); // 24 hours

      console.log(`Built graph with ${nodes.size} nodes in ${graph.fetchTimeMs}ms`);

      return graph;
    } catch (error) {
      console.error('Error building document graph:', error);
      throw error;
    }
  }

  /**
   * Fetch a single document node
   */
  private async fetchNode(
    id: string,
    depth: number,
    visited: Set<string>
  ): Promise<DocumentNode> {
    if (visited.has(id)) {
      throw new Error(`Circular dependency detected: ${id}`);
    }

    visited.add(id);

    try {
      // For now, just fetch bill text
      // In production, this would handle different document types
      const billText = await this.mcpClient.getBillText(id);
      const billStatus = await this.mcpClient.getBillStatus(id);

      return {
        id,
        type: 'bill',
        title: billStatus.id,
        content: billText.text,
        metadata: {
          status: billStatus.status,
          last_action: billStatus.last_action,
          last_action_date: billStatus.last_action_date,
        },
        dependencies: [],
      };
    } catch (error) {
      console.error(`Error fetching node ${id}:`, error);
      throw error;
    }
  }

  /**
   * Recursively fetch dependencies
   */
  private async fetchDependencies(
    node: DocumentNode,
    maxDepth: number,
    currentDepth: number,
    visited: Set<string>,
    nodes: Map<string, DocumentNode>,
    stats: { cacheHits: number; cacheMisses: number }
  ): Promise<void> {
    if (currentDepth >= maxDepth) {
      return;
    }

    // Extract dependencies from node content
    const deps = this.dependencyDetector.extractDependencies(node.content);

    console.log(`Found ${deps.length} dependencies in ${node.id} at depth ${currentDepth}`);

    // Limit dependencies to prevent explosion
    const limitedDeps = deps.slice(0, 20);

    // Fetch each dependency in parallel
    const depPromises = limitedDeps.map(async (dep) => {
      try {
        // Check if already in graph
        if (nodes.has(dep.id)) {
          stats.cacheHits++;
          return nodes.get(dep.id)!;
        }

        // Check cache
        const cacheKey = `node:${dep.id}`;
        let depNode = await this.cache.get(cacheKey) as any as DocumentNode;

        if (depNode) {
          stats.cacheHits++;
        } else {
          // Fetch from MCP
          depNode = await this.fetchNode(dep.id, currentDepth, new Set(visited));
          depNode.relationship = dep.relationship;
          stats.cacheMisses++;

          // Cache individual node
          await this.cache.set(cacheKey, depNode as any, 86400);
        }

        return depNode;
      } catch (error) {
        console.warn(`Failed to fetch dependency ${dep.id}:`, error);
        return null;
      }
    });

    const depNodes = (await Promise.all(depPromises)).filter(Boolean) as DocumentNode[];

    // Add to graph and recurse
    for (const depNode of depNodes) {
      if (!nodes.has(depNode.id)) {
        nodes.set(depNode.id, depNode);
        node.dependencies.push(depNode);

        // Recurse with timeout protection
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 30000)
        );

        const fetchPromise = this.fetchDependencies(
          depNode,
          maxDepth,
          currentDepth + 1,
          visited,
          nodes,
          stats
        );

        try {
          await Promise.race([fetchPromise, timeoutPromise]);
        } catch (error) {
          console.warn(`Timeout or error fetching dependencies for ${depNode.id}`);
        }
      }
    }
  }

  /**
   * Detect cycles in the graph
   */
  private detectCycles(node: DocumentNode, visited: Set<string>): boolean {
    if (visited.has(node.id)) {
      return true;
    }

    visited.add(node.id);

    for (const dep of node.dependencies) {
      if (this.detectCycles(dep, new Set(visited))) {
        return true;
      }
    }

    return false;
  }
}
