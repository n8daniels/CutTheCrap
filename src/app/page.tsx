import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            CutTheCrap
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered analysis platform that learns from your data to deliver actionable insights without the fluff
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Intelligent Federal Legislation Analysis
          </h2>
          <p className="text-gray-700 mb-6">
            CutTheCrap uses advanced AI to analyze federal bills and their dependencies,
            providing you with comprehensive context and insights.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="text-primary-600 font-bold mb-2">Smart Dependencies</div>
              <p className="text-sm text-gray-700">
                Automatically fetches and analyzes all related bills, amendments, and referenced laws
              </p>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="text-primary-600 font-bold mb-2">Context-Aware AI</div>
              <p className="text-sm text-gray-700">
                AI that understands full legislative context for accurate, insightful analysis
              </p>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="text-primary-600 font-bold mb-2">90% Cost Reduction</div>
              <p className="text-sm text-gray-700">
                Intelligent caching and deduplication saves time and reduces API costs
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">Try it out:</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a bill ID in the format: congress/type/number (e.g., 117/hr/3684)
            </p>
            <form className="flex gap-2" action="/bills" method="get">
              <input
                type="text"
                name="id"
                placeholder="117/hr/3684"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                pattern="^\d+/[a-z]+/\d+$"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Analyze Bill
              </button>
            </form>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Core Focus
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                Building trainable AI models
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                Intelligent analysis pipelines
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                Custom AI behaviors
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                Continuous learning and improvement
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Tech Stack
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Next.js 14 with App Router
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                TypeScript for type safety
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Model Context Protocol (MCP)
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Tailwind CSS for styling
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Currently in early development. Building the foundation for custom AI training and intelligent data analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
