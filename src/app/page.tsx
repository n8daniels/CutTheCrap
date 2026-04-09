import SearchBar from '@/components/SearchBar';
import RecentBills from '@/components/RecentBills';

const POLICY_AREAS = [
  'Armed Forces and National Security',
  'Crime and Law Enforcement',
  'Economics and Public Finance',
  'Education',
  'Energy',
  'Environmental Protection',
  'Finance and Financial Sector',
  'Government Operations and Politics',
  'Health',
  'Immigration',
  'International Affairs',
  'Labor and Employment',
  'Science, Technology, Communications',
  'Taxation',
  'Transportation and Public Works',
];

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            See what Congress is actually doing
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Search any federal bill. See what it changes, who sponsored it, and how it connects to everything else.
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar />
            <p className="text-xs text-gray-400 mt-2">
              Search by keyword or bill ID. Bill IDs use the format: <span className="font-mono bg-gray-100 px-1 rounded">congress/type/number</span> — for example, <span className="font-mono bg-gray-100 px-1 rounded">119/hr/1</span> means the 119th Congress, House Resolution, bill #1. You can also try popular names like &ldquo;Big Beautiful Bill&rdquo; or &ldquo;CHIPS Act.&rdquo;
            </p>
          </div>
        </div>

        {/* Recent Bills */}
        <div className="mb-10">
          <RecentBills title="Recently Active in Congress" congress={119} limit={8} />
        </div>

        {/* Browse by Subject */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Browse by Subject</h2>
          <div className="flex flex-wrap gap-2">
            {POLICY_AREAS.map((area) => (
              <a
                key={area}
                href={`/search?q=${encodeURIComponent(area)}`}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
              >
                {area}
              </a>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-600 mb-2">
            CutTheCrap maps the connections between federal bills, the laws they change, and the people behind them.
          </p>
          <p className="text-sm text-gray-400">
            Non-partisan civic tool. 100% public data. Open source.
          </p>
        </div>
      </div>
    </div>
  );
}
