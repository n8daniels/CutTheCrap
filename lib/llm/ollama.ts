import { AnalysisType, LLMAnalysisRequest, LLMAnalysisResponse } from '@/types';

/**
 * Ollama client for local LLM analysis
 */
export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama2';
  }

  /**
   * Generate analysis using Ollama
   */
  async analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResponse> {
    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3, // Lower for more consistent, factual responses
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        analysis: data.response,
        metadata: {
          model: this.model,
          tokens: data.total_duration,
        },
        model: this.model,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Ollama analysis error:', error);
      throw new Error('Failed to generate analysis');
    }
  }

  /**
   * Build prompt based on analysis type
   */
  private buildPrompt(request: LLMAnalysisRequest): string {
    const { content, analysisType, context } = request;

    switch (analysisType) {
      case AnalysisType.SUMMARY:
        return `You are a legislative analyst. Explain the following bill text in 5th-grade language. Be direct, clear, and avoid jargon. Focus on what the bill actually does and who it affects.

Bill text:
${content}

Provide a clear, simple summary:`;

      case AnalysisType.DEEP_DIVE:
        return `You are an expert policy analyst. Provide deep analysis of this bill section, covering:
1. Historical context and precedent
2. Geopolitical implications
3. Economic framework and model
4. Precedent-setting risks
5. Ideological fingerprints

Bill section:
${content}

Provide detailed analysis:`;

      case AnalysisType.IDEOLOGY:
        return `Analyze the ideological position of this legislation on a scale from -5 (socialist/left) to +5 (libertarian/right).

Consider:
- Government intervention vs free market
- Individual liberty vs collective action
- Regulation vs deregulation
- Public vs private sector solutions

Legislation:
${content}

Respond with a score (-5 to +5) and brief explanation:`;

      case AnalysisType.LEAN:
        return `Analyze the political lean of this legislation on a scale from -5 (strongly Democratic/progressive) to +5 (strongly Republican/conservative).

Consider:
- Traditional party positions
- Typical supporter demographics
- Policy approach and philosophy

Legislation:
${content}

Respond with a score (-5 to +5) and brief explanation:`;

      case AnalysisType.ECONOMIC_TAGS:
        return `Identify the economic system characteristics of this legislation. Choose from:
- capitalist
- corporatist
- socialist
- libertarian
- authoritarian
- keynesian
- free_market
- regulated
- redistributive

Legislation:
${content}

List applicable tags with brief justification:`;

      default:
        return content;
    }
  }

  /**
   * Check if Ollama is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const ollamaClient = new OllamaClient();
