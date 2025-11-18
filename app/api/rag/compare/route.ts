import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { question, billId } = await request.json()

    if (!question || !billId) {
      return NextResponse.json(
        { error: 'Question and billId are required' },
        { status: 400 }
      )
    }

    // Run Python script to perform RAG comparison
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_rag_comparison.py')

    try {
      const { stdout } = await execAsync(
        `python3 ${scriptPath} "${billId}" "${question.replace(/"/g, '\\"')}"`,
        { timeout: 30000 } // 30 second timeout
      )

      const result = JSON.parse(stdout)

      return NextResponse.json({
        traditional: result.traditional,
        mcp: result.mcp,
        question,
        billId,
        timestamp: new Date().toISOString()
      })
    } catch (execError) {
      console.error('Python execution error:', execError)

      // Return mock data for demo purposes when Python isn't available
      return NextResponse.json({
        traditional: {
          api_calls: 1,
          documents_loaded: 1,
          chunks_created: 45,
          queries_processed: 1
        },
        mcp: {
          api_calls: 1,
          documents_loaded: 5,
          dependencies_fetched: 4,
          chunks_created: 187,
          queries_processed: 1
        },
        question,
        billId,
        timestamp: new Date().toISOString(),
        note: 'Using mock data - install Python dependencies to see real results'
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'RAG Comparison API is running',
    endpoints: {
      POST: '/api/rag/compare - Run RAG comparison'
    }
  })
}
