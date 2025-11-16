import { NextRequest, NextResponse } from 'next/server';
import { trainingDataExporter } from '@/lib/training-data-exporter';

/**
 * POST /api/training/export
 *
 * Export training data to JSONL format for fine-tuning
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      startDate,
      endDate,
      minFeedbackScore = 4,
      outputFilename = 'training_data.jsonl',
    } = body;

    console.log('Exporting training data...');
    console.log('Filters:', { startDate, endDate, minFeedbackScore });

    // Load training examples with filters
    const examples = await trainingDataExporter.loadTrainingExamples(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      minFeedbackScore
    );

    console.log(`Loaded ${examples.length} training examples`);

    // Deduplicate
    const deduplicated = trainingDataExporter.deduplicateExamples(examples);

    // Export to JSONL
    const outputPath = await trainingDataExporter.exportToJSONL(
      deduplicated,
      outputFilename
    );

    // Generate stats and report
    const stats = await trainingDataExporter.generateStats(deduplicated);
    const report = await trainingDataExporter.createReport(deduplicated);

    return NextResponse.json({
      success: true,
      outputPath,
      stats,
      report,
    });
  } catch (error) {
    console.error('Training export error:', error);
    return NextResponse.json(
      { error: 'Failed to export training data', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/training/export
 *
 * Get training data statistics
 */
export async function GET() {
  try {
    const examples = await trainingDataExporter.loadTrainingExamples();
    const stats = await trainingDataExporter.generateStats(examples);
    const report = await trainingDataExporter.createReport(examples);

    return NextResponse.json({
      stats,
      report,
    });
  } catch (error) {
    console.error('Training stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get training stats', details: String(error) },
      { status: 500 }
    );
  }
}
