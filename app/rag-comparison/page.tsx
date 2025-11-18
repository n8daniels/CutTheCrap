'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SystemMetrics {
  api_calls: number
  documents_loaded: number
  chunks_created: number
  queries_processed: number
  dependencies_fetched?: number
}

interface ComparisonResult {
  traditional: SystemMetrics
  mcp: SystemMetrics
  question: string
  timestamp: string
}

export default function RAGComparison() {
  const [question, setQuestion] = useState('')
  const [billId, setBillId] = useState('bill_117_hr_3684')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runComparison = async () => {
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rag/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, billId })
      })

      if (!response.ok) {
        throw new Error('Comparison failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const sampleQuestions = [
    'What are the key infrastructure funding provisions?',
    'What amendments were made to this bill?',
    'How does this relate to the FAST Act?',
    'What are the broadband deployment provisions?',
  ]

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">RAG System Comparison</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compare Traditional RAG vs MCP-Enhanced RAG in real-time
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-8 p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Ask a Question</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Bill
            </label>
            <select
              value={billId}
              onChange={(e) => setBillId(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="bill_117_hr_3684">H.R. 3684 - Infrastructure Investment Act</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are the key provisions of this bill?"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 h-24"
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sample questions:</p>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={runComparison}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running Comparison...' : 'Compare RAG Systems'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Comparison Results</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Traditional RAG */}
              <div className="p-6 border-2 border-red-300 dark:border-red-700 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
                  Traditional RAG
                </h3>
                <div className="space-y-3">
                  <MetricRow label="API Calls" value={result.traditional.api_calls} />
                  <MetricRow label="Documents Loaded" value={result.traditional.documents_loaded} />
                  <MetricRow label="Chunks Created" value={result.traditional.chunks_created} />
                  <MetricRow label="Queries Processed" value={result.traditional.queries_processed} />
                </div>
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-200">
                  ⚠️ Limited context from single document
                </div>
              </div>

              {/* MCP-Enhanced RAG */}
              <div className="p-6 border-2 border-green-300 dark:border-green-700 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400">
                  MCP-Enhanced RAG
                </h3>
                <div className="space-y-3">
                  <MetricRow label="API Calls" value={result.mcp.api_calls} />
                  <MetricRow label="Documents Loaded" value={result.mcp.documents_loaded} />
                  <MetricRow label="Dependencies Fetched" value={result.mcp.dependencies_fetched || 0} />
                  <MetricRow label="Chunks Created" value={result.mcp.chunks_created} />
                  <MetricRow label="Queries Processed" value={result.mcp.queries_processed} />
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-800 dark:text-green-200">
                  ✅ Rich context with automatic dependencies
                </div>
              </div>
            </div>

            {/* Improvements */}
            <div className="p-6 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Key Improvements</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round((1 - result.mcp.api_calls / result.traditional.api_calls) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    API Call Reduction
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(result.mcp.documents_loaded / result.traditional.documents_loaded)}x
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    More Context
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {result.mcp.dependencies_fetched || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Auto-Fetched Dependencies
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-xl font-bold mb-4">How It Works</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold mb-2">Traditional RAG</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Fetches only the requested document</li>
                <li>Chunks and embeds that single document</li>
                <li>Retrieves relevant chunks</li>
                <li>Limited context for answers</li>
              </ol>
            </div>
            <div>
              <h4 className="font-bold mb-2">MCP-Enhanced RAG</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Fetches document + all dependencies (amendments, laws, etc.)</li>
                <li>Builds complete document graph</li>
                <li>Chunks and embeds all related documents</li>
                <li>Rich, comprehensive context for better answers</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
