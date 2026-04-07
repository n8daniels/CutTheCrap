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
            See what a bill actually does, what it changes, and who is connected to it.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Federal Legislation, Connected
          </h2>
          <p className="text-gray-700 mb-6">
            Enter a bill and CutTheCrap maps the full picture — the laws it amends,
            the regulations it references, the amendments that change it, and the
            people behind it. No spin. No bias. Just the connections.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="text-primary-600 font-bold mb-2">Connect the Dots</div>
              <p className="text-sm text-gray-700">
                See every law, amendment, and regulation a bill touches — mapped automatically
              </p>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="text-primary-600 font-bold mb-2">Plain English</div>
              <p className="text-sm text-gray-700">
                Understand what a bill actually does without reading 200 pages of legalese
              </p>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="text-primary-600 font-bold mb-2">Free &amp; Open</div>
              <p className="text-sm text-gray-700">
                Built on public data. No paywall. No political agenda. For everyone.
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
              What It Does
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">&#x2713;</span>
                Maps bill dependencies — amendments, referenced laws, regulations
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">&#x2713;</span>
                Shows the full legislative chain, not just one document
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">&#x2713;</span>
                Explains impact in plain language
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">&#x2713;</span>
                100% public data — Congress.gov, GovInfo, Federal Register
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Coming Soon
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">&#x2192;</span>
                Follow the money — sponsor donors and lobbying data
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">&#x2192;</span>
                Interactive visual graph of bill connections
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">&#x2192;</span>
                Voting records and committee assignments
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">&#x2192;</span>
                Where the money goes — spending and contracts
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Public legislation should be publicly understandable.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Non-partisan civic tool. Open source. Built by a citizen, for citizens.
          </p>
        </div>
      </div>
    </div>
  );
}
