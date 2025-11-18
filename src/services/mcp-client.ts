/**
 * MCP Client Service - Communicates with FedDocMCP server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Bill, BillText, BillStatus, SearchBillsParams, DocumentGraph } from '@/types/document';
import { config } from '@/lib/config';

export class FedDocMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connectionPool: Map<string, { client: Client; transport: StdioClientTransport }> = new Map();

  /**
   * Connect to FedDocMCP server
   */
  async connect(): Promise<void> {
    if (this.client) {
      return; // Already connected
    }

    try {
      // Create stdio transport to spawn Python MCP server
      this.transport = new StdioClientTransport({
        command: 'python',
        args: [config.fedDocMcpPath],
        env: {
          ...process.env,
          CONGRESS_API_KEY: config.congressApiKey,
        },
      });

      // Create MCP client
      this.client = new Client({
        name: 'cut-the-crap-client',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      // Connect client to transport
      await this.client.connect(this.transport);

      console.log('Connected to FedDocMCP server');
    } catch (error) {
      console.error('Failed to connect to FedDocMCP:', error);
      throw new Error(`MCP connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from FedDocMCP server
   */
  async disconnect(): Promise<void> {
    if (this.client && this.transport) {
      try {
        await this.client.close();
        this.client = null;
        this.transport = null;
        console.log('Disconnected from FedDocMCP server');
      } catch (error) {
        console.error('Error disconnecting from FedDocMCP:', error);
      }
    }
  }

  /**
   * Search for bills
   */
  async searchBills(params: SearchBillsParams): Promise<Bill[]> {
    await this.connect();

    try {
      const result = await this.callTool('search_bills', params);
      return result as Bill[];
    } catch (error) {
      console.error('Error searching bills:', error);
      throw error;
    }
  }

  /**
   * Get bill text
   */
  async getBillText(billId: string): Promise<BillText> {
    await this.connect();

    const [congress, billType, billNumber] = this.parseBillId(billId);

    try {
      const result = await this.callTool('get_bill_text', {
        congress,
        bill_type: billType,
        bill_number: billNumber,
      });
      return result as BillText;
    } catch (error) {
      console.error(`Error getting bill text for ${billId}:`, error);
      throw error;
    }
  }

  /**
   * Get bill status
   */
  async getBillStatus(billId: string): Promise<BillStatus> {
    await this.connect();

    const [congress, billType, billNumber] = this.parseBillId(billId);

    try {
      const result = await this.callTool('get_bill_status', {
        congress,
        bill_type: billType,
        bill_number: billNumber,
      });
      return result as BillStatus;
    } catch (error) {
      console.error(`Error getting bill status for ${billId}:`, error);
      throw error;
    }
  }

  /**
   * Get bill with dependencies (full document graph)
   */
  async getBillWithDependencies(billId: string, depth: number = 2): Promise<DocumentGraph> {
    // This method would coordinate with DocumentGraphBuilder
    // For now, just return basic bill data
    const billText = await this.getBillText(billId);
    const billStatus = await this.getBillStatus(billId);

    // Return minimal graph structure
    return {
      root: {
        id: billId,
        type: 'bill',
        title: billStatus.id,
        content: billText.text,
        metadata: { status: billStatus.status },
        dependencies: [],
      },
      nodes: new Map(),
      totalNodes: 1,
      maxDepth: depth,
      fetchTimeMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Call MCP tool with retry logic
   */
  private async callTool(toolName: string, params: any, retries = 3): Promise<any> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.client.callTool({
          name: toolName,
          arguments: params,
        });

        return result.content;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Tool call failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Parse bill ID into components
   */
  private parseBillId(billId: string): [number, string, number] {
    const parts = billId.split('/');
    if (parts.length !== 3) {
      throw new Error(`Invalid bill ID format: ${billId}. Expected format: congress/type/number`);
    }

    const congress = parseInt(parts[0], 10);
    const billType = parts[1];
    const billNumber = parseInt(parts[2], 10);

    if (isNaN(congress) || isNaN(billNumber)) {
      throw new Error(`Invalid bill ID format: ${billId}`);
    }

    return [congress, billType, billNumber];
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let mcpClientInstance: FedDocMCPClient | null = null;

export function getMCPClient(): FedDocMCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new FedDocMCPClient();
  }
  return mcpClientInstance;
}
