#!/usr/bin/env node

/**
 * Export Training Data CLI
 *
 * Usage:
 *   npm run export-training-data
 *   npm run export-training-data -- --start 2024-01-01 --end 2024-12-31 --min-score 4
 */

import { trainingDataExporter } from '../src/lib/training-data-exporter';

async function main() {
  const args = process.argv.slice(2);

  // Parse command-line arguments
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let minFeedbackScore = 4;
  let outputFilename = 'training_data.jsonl';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--start' && args[i + 1]) {
      startDate = new Date(args[i + 1]);
      i++;
    } else if (arg === '--end' && args[i + 1]) {
      endDate = new Date(args[i + 1]);
      i++;
    } else if (arg === '--min-score' && args[i + 1]) {
      minFeedbackScore = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--output' && args[i + 1]) {
      outputFilename = args[i + 1];
      i++;
    }
  }

  console.log('=== CutTheCrap Training Data Exporter ===\n');
  console.log('Filters:');
  console.log(`  Start Date: ${startDate?.toISOString() || 'None'}`);
  console.log(`  End Date: ${endDate?.toISOString() || 'None'}`);
  console.log(`  Min Feedback Score: ${minFeedbackScore}`);
  console.log(`  Output Filename: ${outputFilename}\n`);

  try {
    // Load training examples
    console.log('Loading training examples...');
    const examples = await trainingDataExporter.loadTrainingExamples(
      startDate,
      endDate,
      minFeedbackScore
    );

    console.log(`Loaded ${examples.length} training examples\n`);

    if (examples.length === 0) {
      console.log('No training examples found. Exiting.');
      process.exit(0);
    }

    // Deduplicate
    console.log('Deduplicating examples...');
    const deduplicated = trainingDataExporter.deduplicateExamples(examples);
    console.log('');

    // Generate stats
    console.log('Generating statistics...');
    const stats = await trainingDataExporter.generateStats(deduplicated);
    console.log('');

    // Print stats
    console.log('=== Statistics ===');
    console.log(`Total Examples: ${stats.totalExamples}`);
    console.log(`Unique Bills: ${stats.totalBills}`);
    console.log(`Avg Documents/Example: ${stats.avgDocumentsPerExample.toFixed(2)}`);
    console.log(`Avg Tokens/Example: ${stats.avgTokensPerExample.toFixed(0)}`);
    console.log('');

    console.log('Feedback Distribution:');
    for (const [feedback, count] of Object.entries(stats.feedbackDistribution)) {
      const percentage = ((count / stats.totalExamples) * 100).toFixed(1);
      console.log(`  ${feedback}: ${count} (${percentage}%)`);
    }
    console.log('');

    // Export to JSONL
    console.log('Exporting to JSONL...');
    const outputPath = await trainingDataExporter.exportToJSONL(
      deduplicated,
      outputFilename
    );

    console.log('');
    console.log('✅ Export successful!');
    console.log(`Output file: ${outputPath}`);
    console.log('');

    // Generate and print report
    const report = await trainingDataExporter.createReport(deduplicated);
    console.log(report);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

main();
