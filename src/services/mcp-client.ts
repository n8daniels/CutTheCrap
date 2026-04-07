/**
 * MCP Client Service - Communicates with FedDocMCP server
 *
 * SECURITY CONTROLS APPLIED:
 * - MCP server path validation (prevents command injection)
 * - Filtered environment variables (prevents secret leakage)
 * - Bill type validation (prevents SSRF)
 *
 * See: docs/security/llm-rag-mcp-security.md
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Bill, BillText, BillStatus, SearchBillsParams, DocumentGraph } from '@/types/document';
import { config } from '@/lib/config';
import { validateMCPServerPath, buildSecureEnv, validateBillType } from '@/security/mcp-config';
import { logMCPToolCall } from '@/lib/audit-logger';
import { trackCongressAPIRequest } from '@/lib/api-quota-monitor';

export class FedDocMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connectionPool: Map<string, { client: Client; transport: StdioClientTransport }> = new Map();

  /**
   * Connect to FedDocMCP server
   *
   * SECURITY: Validates server path and filters environment variables
   */
  async connect(): Promise<void> {
    if (this.client) {
      return; // Already connected
    }

    try {
      // SECURITY FIX: Validate MCP server path against allowlist
      // Prevents command injection via FEDDOC_MCP_PATH environment variable
      // See: docs/security/threat_model.md - Scenario 1
      validateMCPServerPath(config.fedDocMcpPath);

      // SECURITY FIX: Only pass allowlisted environment variables
      // Prevents secret leakage via process inspection
      // See: docs/security/threat_model.md - Scenario 5
      const secureEnv = buildSecureEnv();

      // Create stdio transport to spawn Python MCP server
      this.transport = new StdioClientTransport({
        command: 'python',
        args: [config.fedDocMcpPath],
        env: secureEnv, // SECURITY: Filtered env, not full process.env
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

      // Extract text from Congress API response
      const bill = result.bill || {};
      const textVersions = result.text || [];

      // Get the latest text version or use title as fallback
      let text = bill.title || 'Bill text not available';
      if (textVersions.length > 0) {
        const latestVersion = textVersions[0];
        text = `${bill.title}\n\n[Text version: ${latestVersion.type}]\n\n${bill.title}`;
      }

      return {
        id: billId,
        text,
        format: 'txt',
      } as BillText;
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

      // Return formatted status
      return {
        id: result.id || billId,
        status: result.status || 'Unknown',
        last_action: result.last_action || 'No action recorded',
        last_action_date: result.last_action_date || new Date().toISOString().split('T')[0],
      } as BillStatus;
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
   * Call MCP tool with retry logic and audit logging
   *
   * SECURITY: All tool calls are logged for security monitoring
   */
  private async callTool(toolName: string, params: any, retries = 3): Promise<any> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    const startTime = Date.now();
    let lastError: any = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.client.callTool({
          name: toolName,
          arguments: params,
        });

        const durationMs = Date.now() - startTime;

        // SECURITY: Track Congress.gov API quota usage
        trackCongressAPIRequest();

        // SECURITY: Log successful MCP tool call
        await logMCPToolCall({
          toolName,
          arguments: params,
          result: 'success',
          durationMs,
          ipAddress: 'server', // MCP calls are server-side
        });

        // Parse JSON response from TextContent
        if (result.content && Array.isArray(result.content) && result.content.length > 0) {
          const textContent = result.content[0];
          if (textContent.type === 'text' && textContent.text) {
            return JSON.parse(textContent.text);
          }
        }

        return result.content;
      } catch (error) {
        lastError = error;

        if (attempt === retries) {
          const durationMs = Date.now() - startTime;

          // SECURITY: Log failed MCP tool call
          await logMCPToolCall({
            toolName,
            arguments: params,
            result: 'failure',
            durationMs,
            ipAddress: 'server',
            error: error instanceof Error ? error.message : String(error),
          });

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
   * Parse bill ID into components with security validation
   *
   * SECURITY: Validates bill type against allowlist
   */
  private parseBillId(billId: string): [number, string, number] {
    const parts = billId.split('/');
    if (parts.length !== 3) {
      throw new Error(`Invalid bill ID format: ${billId}. Expected format: congress/type/number`);
    }

    const congress = parseInt(parts[0], 10);
    const billNumber = parseInt(parts[2], 10);

    if (isNaN(congress) || isNaN(billNumber)) {
      throw new Error(`Invalid bill ID format: ${billId}`);
    }

    // SECURITY FIX: Validate bill type against allowlist
    // Prevents SSRF via malicious bill type parameter
    // See: docs/security/llm-rag-mcp-security.md - Section 2
    const billType = validateBillType(parts[1]);

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
