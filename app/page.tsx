import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            Cut<span className="text-blue-600">The</span>Crap
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            AI-Powered Analysis Platform
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500">
            Train AI models that understand your data. No fluff, no BS, just results.
          </p>
        </header>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* RAG Comparison */}
          <Link
            href="/rag-comparison"
            className="block p-8 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-4">🔍 RAG System Comparison</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              See the difference between traditional RAG and MCP-enhanced retrieval.
            </p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
              <li>✓ 90% reduction in API calls</li>
              <li>✓ 5x richer context</li>
              <li>✓ Interactive demo with visualizations</li>
              <li>✓ Real federal legislation examples</li>
            </ul>
            <div className="mt-6 inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold">
              Try the Demo →
            </div>
          </Link>

          {/* Document Analysis (Coming Soon) */}
          <div className="p-8 border-2 border-gray-300 dark:border-gray-700 rounded-lg opacity-60">
            <h2 className="text-2xl font-bold mb-4">📄 Document Analysis</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload documents and get AI-powered insights.
            </p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
              <li>✓ Smart chunking and embedding</li>
              <li>✓ Context-aware analysis</li>
              <li>✓ Training data generation</li>
              <li>✓ Custom model fine-tuning</li>
            </ul>
            <div className="mt-6 inline-flex items-center text-gray-400 font-semibold">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Built With</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Next.js', desc: 'React Framework' },
              { name: 'TypeScript', desc: 'Type Safety' },
              { name: 'Python', desc: 'AI/ML Backend' },
              { name: 'FAISS', desc: 'Vector Search' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg text-center"
              >
                <div className="font-bold">{tech.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-500">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="border-t border-gray-300 dark:border-gray-700 pt-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">90%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                API Cost Reduction
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">5x</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                More Context
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">100%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Open Source
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-500">
          <p>Built by Nate Daniels</p>
          <p className="mt-2">
            <a
              href="https://github.com/n8daniels/CutTheCrap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
