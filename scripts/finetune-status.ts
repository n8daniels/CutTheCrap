#!/usr/bin/env node

/**
 * Check Fine-tuning Job Status CLI
 *
 * Usage:
 *   npm run finetune-status
 *   npm run finetune-status -- --job-id ftjob-xxxxx
 */

import { cutTheCrapLLM } from '../src/lib/cutthecrap-llm';

async function main() {
  const args = process.argv.slice(2);

  let jobId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--job-id' && args[i + 1]) {
      jobId = args[i + 1];
      i++;
    }
  }

  console.log('=== CutTheCrapLLM Fine-tuning Status ===\n');

  try {
    if (jobId) {
      // Check specific job
      console.log(`Checking status for job: ${jobId}\n`);
      const status = await cutTheCrapLLM.checkFineTuningStatus(jobId);

      console.log('Job Details:');
      console.log(`  ID: ${status.id}`);
      console.log(`  Status: ${status.status}`);
      console.log(`  Model: ${status.model || 'Not yet available'}`);
      console.log(`  Trained Tokens: ${status.trainedTokens || 'N/A'}`);

      if (status.error) {
        console.log(`  Error: ${JSON.stringify(status.error)}`);
      }

      console.log('');

      if (status.status === 'succeeded') {
        console.log('✅ Fine-tuning completed successfully!');
        console.log('');
        console.log('Update your .env file:');
        console.log(`CUTTHECRAP_MODEL_ID=${status.model}`);
      } else if (status.status === 'failed') {
        console.log('❌ Fine-tuning failed');
      } else {
        console.log(`⏳ Fine-tuning in progress (${status.status})...`);
      }
    } else {
      // List all jobs
      console.log('Fetching all fine-tuning jobs...\n');
      const jobs = await cutTheCrapLLM.listFineTuningJobs(20);

      if (jobs.length === 0) {
        console.log('No fine-tuning jobs found.');
      } else {
        console.log(`Found ${jobs.length} fine-tuning jobs:\n`);

        for (const job of jobs) {
          console.log(`Job ID: ${job.id}`);
          console.log(`  Status: ${job.status}`);
          console.log(`  Model: ${job.model || 'Not yet available'}`);
          console.log(`  Created: ${job.createdAt}`);
          console.log('');
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to check status:', error);
    process.exit(1);
  }
}

main();
