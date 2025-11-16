#!/usr/bin/env node

/**
 * Fine-tune CutTheCrapLLM CLI
 *
 * Usage:
 *   npm run finetune -- --training-file data/training/training_data.jsonl
 */

import { cutTheCrapLLM } from '../src/lib/cutthecrap-llm';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);

  let trainingFilePath: string | undefined;
  let validationFilePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--training-file' && args[i + 1]) {
      trainingFilePath = args[i + 1];
      i++;
    } else if (arg === '--validation-file' && args[i + 1]) {
      validationFilePath = args[i + 1];
      i++;
    }
  }

  if (!trainingFilePath) {
    console.error('❌ Error: --training-file is required');
    console.log('\nUsage:');
    console.log('  npm run finetune -- --training-file data/training/training_data.jsonl');
    console.log('  npm run finetune -- --training-file data/training/training_data.jsonl --validation-file data/training/validation_data.jsonl');
    process.exit(1);
  }

  // Check if training file exists
  if (!fs.existsSync(trainingFilePath)) {
    console.error(`❌ Error: Training file not found: ${trainingFilePath}`);
    process.exit(1);
  }

  // Check if validation file exists (if provided)
  if (validationFilePath && !fs.existsSync(validationFilePath)) {
    console.error(`❌ Error: Validation file not found: ${validationFilePath}`);
    process.exit(1);
  }

  console.log('=== CutTheCrapLLM Fine-tuning ===\n');
  console.log(`Training File: ${trainingFilePath}`);
  if (validationFilePath) {
    console.log(`Validation File: ${validationFilePath}`);
  }
  console.log('');

  try {
    console.log('Starting fine-tuning job...');
    const jobId = await cutTheCrapLLM.fineTune(trainingFilePath, validationFilePath);

    console.log('');
    console.log('✅ Fine-tuning job started successfully!');
    console.log(`Job ID: ${jobId}`);
    console.log('');
    console.log('You can check the status with:');
    console.log(`  npm run finetune-status -- --job-id ${jobId}`);
    console.log('');
    console.log('Or list all jobs with:');
    console.log('  npm run finetune-status');
  } catch (error) {
    console.error('❌ Fine-tuning failed:', error);
    process.exit(1);
  }
}

main();
