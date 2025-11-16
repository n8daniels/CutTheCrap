import * as fs from 'fs/promises';
import * as path from 'path';
import type { TrainingExample, FineTuningExample, AIContext } from '@/types';
import { config } from './config';

/**
 * Training Data Exporter
 *
 * This module handles:
 * 1. Collecting user interactions with the AI
 * 2. Formatting them for fine-tuning
 * 3. Exporting to JSONL format for OpenAI fine-tuning
 * 4. Managing training data quality and deduplication
 */

export class TrainingDataExporter {
  private trainingDir: string;

  constructor(trainingDir: string = config.trainingDataDir) {
    this.trainingDir = trainingDir;
  }

  /**
   * Initialize training data directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.trainingDir, { recursive: true });
      console.log(`Training data directory initialized: ${this.trainingDir}`);
    } catch (error) {
      console.error('Failed to initialize training data directory:', error);
      throw error;
    }
  }

  /**
   * Save a single training example
   */
  async saveTrainingExample(example: TrainingExample): Promise<void> {
    await this.initialize();

    const filename = `training_example_${Date.now()}_${Math.random().toString(36).substring(7)}.json`;
    const filepath = path.join(this.trainingDir, filename);

    await fs.writeFile(filepath, JSON.stringify(example, null, 2));
    console.log(`Saved training example: ${filename}`);
  }

  /**
   * Load all training examples from directory
   */
  async loadTrainingExamples(
    startDate?: Date,
    endDate?: Date,
    minFeedbackScore?: number
  ): Promise<TrainingExample[]> {
    await this.initialize();

    const files = await fs.readdir(this.trainingDir);
    const examples: TrainingExample[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filepath = path.join(this.trainingDir, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const example: TrainingExample = JSON.parse(content);

      // Filter by date
      if (startDate && new Date(example.metadata.timestamp) < startDate) continue;
      if (endDate && new Date(example.metadata.timestamp) > endDate) continue;

      // Filter by feedback score
      if (minFeedbackScore !== undefined) {
        const feedback = example.metadata.userFeedback;
        if (typeof feedback === 'number' && feedback < minFeedbackScore) continue;
        if (feedback === 'not_helpful') continue;
      }

      examples.push(example);
    }

    return examples;
  }

  /**
   * Convert training examples to OpenAI fine-tuning format (JSONL)
   */
  convertToFineTuningFormat(examples: TrainingExample[]): FineTuningExample[] {
    return examples.map(example => {
      // Build system message with context
      const systemMessage = this.buildSystemMessage(example.context);

      return {
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: example.input,
          },
          {
            role: 'assistant',
            content: example.output,
          },
        ],
      };
    });
  }

  /**
   * Build system message with document context
   * This is crucial for training - the model learns to use context effectively
   */
  private buildSystemMessage(context: AIContext): string {
    const parts: string[] = [
      'You are CutTheCrapLLM, an AI assistant specialized in analyzing federal legislation.',
      'You provide clear, accurate, and concise analysis without unnecessary fluff.',
      '',
      '=== DOCUMENT CONTEXT ===',
    ];

    // Primary bill
    parts.push(`PRIMARY BILL: ${context.primaryBill.title} (${context.primaryBill.id})`);
    parts.push(`Status: ${context.primaryBill.metadata.status || 'Unknown'}`);

    // Only include a summary or key sections, not the full text
    const textPreview = context.primaryBill.fullText.substring(0, 5000);
    parts.push(`\nBill Text Preview:\n${textPreview}...\n`);

    // Dependencies
    if (context.dependencies.length > 0) {
      parts.push(`\nRELATED DOCUMENTS (${context.dependencies.length}):`);

      for (const dep of context.dependencies) {
        parts.push(`\n- ${dep.title} (${dep.id})`);
        parts.push(`  Type: ${dep.type}`);
        parts.push(`  Relationship: ${dep.relationship}`);
        parts.push(`  Summary: ${dep.summary.substring(0, 500)}...`);

        if (dep.relevantSections.length > 0) {
          parts.push(`  Relevant Sections: ${dep.relevantSections.join(', ')}`);
        }
      }
    }

    // Metadata
    parts.push(`\n=== METADATA ===`);
    parts.push(`Documents Included: ${context.metadata.documentsIncluded}`);
    parts.push(`Dependency Depth: ${context.metadata.dependencyDepth}`);
    parts.push(`Estimated Tokens: ${context.metadata.totalTokensEstimate}`);

    parts.push('\n=== INSTRUCTIONS ===');
    parts.push('Use the above context to provide accurate, well-informed responses.');
    parts.push('Cut through the complexity and deliver clear, actionable insights.');
    parts.push('Always cite specific sections or documents when making claims.');

    return parts.join('\n');
  }

  /**
   * Export training examples to JSONL file
   */
  async exportToJSONL(
    examples: TrainingExample[],
    outputFilename: string = 'training_data.jsonl'
  ): Promise<string> {
    await this.initialize();

    const fineTuningExamples = this.convertToFineTuningFormat(examples);
    const jsonlContent = fineTuningExamples
      .map(ex => JSON.stringify(ex))
      .join('\n');

    const outputPath = path.join(this.trainingDir, outputFilename);
    await fs.writeFile(outputPath, jsonlContent);

    console.log(`Exported ${examples.length} training examples to ${outputPath}`);
    console.log(`File size: ${(jsonlContent.length / 1024 / 1024).toFixed(2)} MB`);

    return outputPath;
  }

  /**
   * Generate training data statistics
   */
  async generateStats(examples: TrainingExample[]): Promise<{
    totalExamples: number;
    totalBills: number;
    avgDocumentsPerExample: number;
    avgTokensPerExample: number;
    feedbackDistribution: Record<string, number>;
    dateRange: { start: string; end: string };
  }> {
    const billIds = new Set<string>();
    let totalDocuments = 0;
    let totalTokens = 0;
    const feedbackCounts: Record<string, number> = {};

    let minDate = new Date();
    let maxDate = new Date(0);

    for (const example of examples) {
      billIds.add(example.metadata.billId);
      totalDocuments += example.metadata.documentsIncluded;
      totalTokens += example.context.metadata.totalTokensEstimate;

      const feedback = String(example.metadata.userFeedback || 'none');
      feedbackCounts[feedback] = (feedbackCounts[feedback] || 0) + 1;

      const exampleDate = new Date(example.metadata.timestamp);
      if (exampleDate < minDate) minDate = exampleDate;
      if (exampleDate > maxDate) maxDate = exampleDate;
    }

    return {
      totalExamples: examples.length,
      totalBills: billIds.size,
      avgDocumentsPerExample: totalDocuments / examples.length,
      avgTokensPerExample: totalTokens / examples.length,
      feedbackDistribution: feedbackCounts,
      dateRange: {
        start: minDate.toISOString(),
        end: maxDate.toISOString(),
      },
    };
  }

  /**
   * Deduplicate training examples
   * Remove similar questions about the same bill
   */
  deduplicateExamples(examples: TrainingExample[]): TrainingExample[] {
    const seen = new Set<string>();
    const deduplicated: TrainingExample[] = [];

    for (const example of examples) {
      // Create a hash of bill ID + normalized question
      const key = `${example.metadata.billId}:${this.normalizeQuestion(example.input)}`;

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(example);
      }
    }

    console.log(`Deduplicated: ${examples.length} -> ${deduplicated.length} examples`);
    return deduplicated;
  }

  /**
   * Normalize question for deduplication
   */
  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .substring(0, 100);
  }

  /**
   * Create training data report
   */
  async createReport(examples: TrainingExample[]): Promise<string> {
    const stats = await this.generateStats(examples);

    const report = [
      '=== CutTheCrapLLM Training Data Report ===',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Total Examples: ${stats.totalExamples}`,
      `Unique Bills: ${stats.totalBills}`,
      `Avg Documents/Example: ${stats.avgDocumentsPerExample.toFixed(2)}`,
      `Avg Tokens/Example: ${stats.avgTokensPerExample.toFixed(0)}`,
      '',
      '=== Feedback Distribution ===',
      ...Object.entries(stats.feedbackDistribution).map(
        ([feedback, count]) => `${feedback}: ${count} (${((count / stats.totalExamples) * 100).toFixed(1)}%)`
      ),
      '',
      `=== Date Range ===`,
      `Start: ${stats.dateRange.start}`,
      `End: ${stats.dateRange.end}`,
      '',
      '=== Recommendations ===',
    ];

    // Add recommendations
    if (stats.totalExamples < 100) {
      report.push('⚠️  Low example count. Aim for at least 100-500 examples for effective fine-tuning.');
    }

    if (stats.avgTokensPerExample > 8000) {
      report.push('⚠️  High token count per example. Consider reducing context size.');
    }

    const helpfulRate = (stats.feedbackDistribution['helpful'] || 0) / stats.totalExamples;
    if (helpfulRate < 0.7) {
      report.push('⚠️  Low helpful feedback rate. Filter for higher quality examples.');
    }

    return report.join('\n');
  }
}

// Export singleton instance
export const trainingDataExporter = new TrainingDataExporter();
