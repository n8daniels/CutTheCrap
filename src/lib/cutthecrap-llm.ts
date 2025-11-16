import OpenAI from 'openai';
import type { AIContext, TrainingExample } from '@/types';
import { config } from './config';
import { trainingDataExporter } from './training-data-exporter';

/**
 * CutTheCrapLLM - Custom fine-tuned model for federal legislation analysis
 *
 * This class handles:
 * 1. Inference using the fine-tuned model
 * 2. Collecting training data from user interactions
 * 3. Managing model versions
 * 4. Streaming responses
 */
export class CutTheCrapLLM {
  private openai: OpenAI;
  private modelId: string;
  private trainingMode: boolean;

  constructor(modelId?: string) {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
      organization: config.openaiOrgId,
    });

    this.modelId = modelId || config.cutTheCrapModelId;
    this.trainingMode = config.trainingMode;
  }

  /**
   * Generate a response using CutTheCrapLLM
   */
  async chat(
    question: string,
    context?: AIContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    const messages = this.buildMessages(question, context, conversationHistory);

    const response = await this.openai.chat.completions.create({
      model: this.modelId,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const output = response.choices[0]?.message?.content || 'No response generated';

    // If in training mode, collect this interaction
    if (this.trainingMode && context) {
      await this.collectTrainingData(question, context, output);
    }

    return output;
  }

  /**
   * Stream a response using CutTheCrapLLM
   */
  async chatStream(
    question: string,
    context?: AIContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AsyncIterable<string>> {
    const messages = this.buildMessages(question, context, conversationHistory);

    const stream = await this.openai.chat.completions.create({
      model: this.modelId,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    // Convert to async iterable of strings
    return this.convertStreamToText(stream);
  }

  /**
   * Build messages array for the API
   */
  private buildMessages(
    question: string,
    context?: AIContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const systemMessage = this.buildSystemMessage(context);

    return [
      { role: 'system', content: systemMessage },
      ...conversationHistory,
      { role: 'user', content: question },
    ];
  }

  /**
   * Build system message with context
   */
  private buildSystemMessage(context?: AIContext): string {
    const parts: string[] = [
      'You are CutTheCrapLLM, an AI assistant specialized in analyzing federal legislation.',
      'Your mission: Cut through complexity and deliver clear, actionable insights.',
      'Always be accurate, concise, and cite your sources.',
    ];

    if (context) {
      parts.push('', '=== DOCUMENT CONTEXT ===');
      parts.push(`Primary Bill: ${context.primaryBill.title} (${context.primaryBill.id})`);

      if (context.dependencies.length > 0) {
        parts.push(`\nRelated Documents (${context.dependencies.length}):`);
        for (const dep of context.dependencies) {
          parts.push(`- ${dep.title} (${dep.type}): ${dep.relationship}`);
        }
      }

      parts.push('\nUse this context to inform your responses. Cite specific sections when relevant.');
    }

    return parts.join('\n');
  }

  /**
   * Convert OpenAI stream to text-only async iterable
   */
  private async *convertStreamToText(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
  ): AsyncIterable<string> {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Collect training data from user interaction
   */
  private async collectTrainingData(
    question: string,
    context: AIContext,
    output: string
  ): Promise<void> {
    try {
      const trainingExample: TrainingExample = {
        input: question,
        context,
        output,
        metadata: {
          billId: context.primaryBill.id,
          documentsIncluded: context.metadata.documentsIncluded,
          timestamp: new Date().toISOString(),
          modelVersion: this.modelId,
        },
      };

      await trainingDataExporter.saveTrainingExample(trainingExample);
      console.log('Training data collected successfully');
    } catch (error) {
      console.error('Failed to collect training data:', error);
      // Don't throw - this shouldn't break the user experience
    }
  }

  /**
   * Record user feedback on a response
   * This is critical for filtering high-quality training data
   */
  async recordFeedback(
    interactionId: string,
    feedback: 'helpful' | 'not_helpful' | number
  ): Promise<void> {
    // TODO: Implement feedback storage
    // For now, just log it
    console.log(`Feedback recorded for ${interactionId}: ${feedback}`);
  }

  /**
   * Fine-tune a new version of CutTheCrapLLM
   */
  async fineTune(
    trainingFilePath: string,
    validationFilePath?: string
  ): Promise<string> {
    console.log('Starting fine-tuning job...');

    // Upload training file
    const trainingFile = await this.openai.files.create({
      file: await import('fs').then(fs => fs.createReadStream(trainingFilePath)),
      purpose: 'fine-tune',
    });

    console.log(`Training file uploaded: ${trainingFile.id}`);

    // Upload validation file if provided
    let validationFileId: string | undefined;
    if (validationFilePath) {
      const validationFile = await this.openai.files.create({
        file: await import('fs').then(fs => fs.createReadStream(validationFilePath)),
        purpose: 'fine-tune',
      });
      validationFileId = validationFile.id;
      console.log(`Validation file uploaded: ${validationFileId}`);
    }

    // Create fine-tuning job
    const fineTuningJob = await this.openai.fineTuning.jobs.create({
      training_file: trainingFile.id,
      validation_file: validationFileId,
      model: 'gpt-4o-mini-2024-07-18', // Base model to fine-tune
      suffix: 'cutthecrap',
    });

    console.log(`Fine-tuning job created: ${fineTuningJob.id}`);
    console.log(`Status: ${fineTuningJob.status}`);

    return fineTuningJob.id;
  }

  /**
   * Check fine-tuning job status
   */
  async checkFineTuningStatus(jobId: string): Promise<any> {
    const job = await this.openai.fineTuning.jobs.retrieve(jobId);
    return {
      id: job.id,
      status: job.status,
      model: job.fine_tuned_model,
      trainedTokens: job.trained_tokens,
      error: job.error,
    };
  }

  /**
   * List all fine-tuning jobs
   */
  async listFineTuningJobs(limit: number = 10): Promise<any[]> {
    const jobs = await this.openai.fineTuning.jobs.list({ limit });
    return jobs.data.map(job => ({
      id: job.id,
      status: job.status,
      model: job.fine_tuned_model,
      createdAt: new Date(job.created_at * 1000).toISOString(),
    }));
  }
}

// Export singleton instance
export const cutTheCrapLLM = new CutTheCrapLLM();
