import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from '@/lib/config';
import type { BillData, SearchBillsParams, DocumentGraph, DocumentNode } from '@/types';

export class FedDocMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected = false;

  /**
   * Connect to the FedDocMCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // Create transport to Python MCP server
      this.transport = new StdioClientTransport({
        command: 'python3',
        args: [config.fedDocMcpPath],
        env: {
          ...process.env,
          CONGRESS_API_KEY: config.congressApiKey,
        },
      });

      this.client = new Client(
        {
          name: 'cutthecrap-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(this.transport);
      this.connected = true;
      console.log('Connected to FedDocMCP server');
    } catch (error) {
      console.error('Failed to connect to FedDocMCP:', error);
      throw new Error(`FedDocMCP connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from the FedDocMCP server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.client?.close();
      this.connected = false;
      this.client = null;
      this.transport = null;
      console.log('Disconnected from FedDocMCP server');
    } catch (error) {
      console.error('Error disconnecting from FedDocMCP:', error);
    }
  }

  /**
   * Ensure client is connected before making requests
   */
  private ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new Error('MCP client not connected. Call connect() first.');
    }
  }

  /**
   * Call a tool on the MCP server with retry logic
   */
  private async callTool(toolName: string, args: any, retries = 3): Promise<any> {
    this.ensureConnected();

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await this.client!.callTool({
          name: toolName,
          arguments: args,
        });

        if (result.content && result.content.length > 0) {
          // Assuming the first content item contains the result
          const content = result.content[0];
          if ('text' in content) {
            return JSON.parse(content.text);
          }
        }

        throw new Error('No content in MCP response');
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed for ${toolName}:`, error);

        if (attempt === retries - 1) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Search for bills
   */
  async searchBills(params: SearchBillsParams): Promise<BillData[]> {
    return this.callTool('search_bills', params);
  }

  /**
   * Get full bill text and metadata
   */
  async getBill(billId: string): Promise<BillData> {
    const [congress, billType, billNumber] = billId.split('/');
    return this.callTool('get_bill_text', {
      congress: parseInt(congress),
      bill_type: billType,
      bill_number: parseInt(billNumber),
    });
  }

  /**
   * Get bill status and metadata
   */
  async getBillStatus(billId: string): Promise<any> {
    const [congress, billType, billNumber] = billId.split('/');
    return this.callTool('get_bill_status', {
      congress: parseInt(congress),
      bill_type: billType,
      bill_number: parseInt(billNumber),
    });
  }

  /**
   * Get bill with all dependencies (full document graph)
   * This is the KEY method for training data collection
   */
  async getBillWithDependencies(
    billId: string,
    maxDepth: number = 2
  ): Promise<DocumentGraph> {
    const startTime = Date.now();
    const visited = new Set<string>();
    const nodes = new Map<string, DocumentNode>();
    let cacheHits = 0;
    let cacheMisses = 0;

    // Fetch root bill
    const rootBill = await this.getBill(billId);
    const root: DocumentNode = {
      id: billId,
      type: 'bill',
      title: rootBill.title,
      content: rootBill.text || rootBill.summary || '',
      metadata: {
        sponsor: rootBill.sponsor,
        introduced_date: rootBill.introduced_date,
        status: rootBill.status,
        congress: rootBill.congress,
        bill_type: rootBill.bill_type,
        bill_number: rootBill.bill_number,
      },
      dependencies: [],
    };

    visited.add(billId);
    nodes.set(billId, root);
    cacheMisses++;

    // TODO: Implement recursive dependency fetching
    // This will be expanded in the dependency-detector service

    return {
      root,
      nodes,
      totalNodes: nodes.size,
      maxDepth,
      fetchTimeMs: Date.now() - startTime,
      cacheHits,
      cacheMisses,
    };
  }

  /**
   * Health check - verify MCP server is responding
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.ensureConnected();
      // Try to list available tools as a health check
      const tools = await this.client!.listTools();
      return tools.tools.length > 0;
    } catch (error) {
      console.error('MCP health check failed:', error);
      return false;
    }
  }
}

// Singleton instance for reuse across requests
let mcpClientInstance: FedDocMCPClient | null = null;

/**
 * Get or create MCP client instance
 */
export async function getMCPClient(): Promise<FedDocMCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new FedDocMCPClient();
    await mcpClientInstance.connect();
  }

  // Verify connection is still healthy
  const isHealthy = await mcpClientInstance.healthCheck();
  if (!isHealthy) {
    console.log('MCP client unhealthy, reconnecting...');
    await mcpClientInstance.disconnect();
    await mcpClientInstance.connect();
  }

  return mcpClientInstance;
}

/**
 * Cleanup function for graceful shutdown
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.disconnect();
    mcpClientInstance = null;
  }
}
