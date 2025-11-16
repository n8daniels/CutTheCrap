import { NextRequest, NextResponse } from 'next/server';
import { cutTheCrapLLM } from '@/lib/cutthecrap-llm';

/**
 * POST /api/training/finetune
 *
 * Start a fine-tuning job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trainingFilePath, validationFilePath } = body;

    if (!trainingFilePath) {
      return NextResponse.json(
        { error: 'trainingFilePath is required' },
        { status: 400 }
      );
    }

    console.log('Starting fine-tuning job...');

    const jobId = await cutTheCrapLLM.fineTune(
      trainingFilePath,
      validationFilePath
    );

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Fine-tuning job started successfully',
    });
  } catch (error) {
    console.error('Fine-tuning error:', error);
    return NextResponse.json(
      { error: 'Failed to start fine-tuning', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/training/finetune?jobId=xxx
 *
 * Check fine-tuning job status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific job status
      const status = await cutTheCrapLLM.checkFineTuningStatus(jobId);
      return NextResponse.json(status);
    } else {
      // List all jobs
      const jobs = await cutTheCrapLLM.listFineTuningJobs();
      return NextResponse.json({ jobs });
    }
  } catch (error) {
    console.error('Fine-tuning status error:', error);
    return NextResponse.json(
      { error: 'Failed to get fine-tuning status', details: String(error) },
      { status: 500 }
    );
  }
}
