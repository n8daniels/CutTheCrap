export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">CutTheCrap</h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered legislative analysis. No fluff, just results.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-2">v0.1 - Basic MCP Integration</h2>
          <p className="text-gray-700 mb-4">
            Testing FedDocMCP integration with single bill fetching.
          </p>
          <p className="text-sm text-gray-600">
            Next: Navigate to <code className="bg-gray-100 px-2 py-1 rounded">/bills/118/hr/3684</code> to test
          </p>
        </div>
      </div>
    </main>
  );
}
