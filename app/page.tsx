export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-6xl font-bold text-center mb-8">
          CutTheCrap
        </h1>

        <p className="text-xl text-center mb-12 text-gray-600">
          An AI-powered platform that learns from federal legislation to deliver actionable insights
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">🧠 Custom AI Training</h2>
            <p className="text-gray-600">
              Build and fine-tune your own CutTheCrapLLM using federal documents fetched via MCP
            </p>
          </div>

          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">📚 Smart Context</h2>
            <p className="text-gray-600">
              Automatically fetch bills with all dependencies to provide complete legislative context
            </p>
          </div>

          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">⚡ Training Data</h2>
            <p className="text-gray-600">
              Collect high-quality training examples from every user interaction with the AI
            </p>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-semibold mb-4">🚀 Getting Started</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">1. Set up FedDocMCP</h3>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                <code>{`git submodule add https://github.com/yourusername/feddoc-mcp.git packages/feddoc-mcp
git submodule update --init --recursive`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">2. Configure Environment</h3>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                <code>{`cp .env.example .env
# Edit .env with your API keys`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3. Start Development Server</h3>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                <code>{`npm run dev`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">4. Collect Training Data</h3>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                <code>{`# Chat with the API (training mode enabled)
curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Explain H.R. 3684", "billId": "117/hr/3684"}'

# Export training data
npm run export-training-data`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">5. Fine-tune CutTheCrapLLM</h3>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                <code>{`npm run finetune`}</code>
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">📖 Architecture</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>FedDocMCP</strong> - Fetches federal documents via Congress API</li>
            <li><strong>Document Graph Builder</strong> - Builds dependency graphs of related bills/laws</li>
            <li><strong>Training Data Collector</strong> - Captures user interactions for fine-tuning</li>
            <li><strong>CutTheCrapLLM</strong> - Custom fine-tuned model for legislative analysis</li>
            <li><strong>Inference API</strong> - Streaming chat endpoint with document context</li>
          </ul>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">
            Built with Next.js, TypeScript, OpenAI, and Model Context Protocol
          </p>
        </div>
      </div>
    </main>
  );
}
