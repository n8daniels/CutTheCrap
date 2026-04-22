'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeBillId } from '@/lib/bill-id';

// Map popular nicknames to bill IDs
const BILL_NICKNAMES: Record<string, { id: string; title: string }> = {
  // The Big Beautiful Bill / Reconciliation
  'big beautiful bill': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'beautiful bill': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'reconciliation': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'trump tax bill': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'tax cuts': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'doge': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'medicaid cuts': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'snap cuts': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'food stamps': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },

  // Surveillance / Privacy
  'fisa': { id: '118/hr/7888', title: 'Reforming Intelligence and Securing America Act (FISA Section 702)' },
  'fisa 702': { id: '118/hr/7888', title: 'Reforming Intelligence and Securing America Act (FISA Section 702)' },
  'fisa section 702': { id: '118/hr/7888', title: 'Reforming Intelligence and Securing America Act (FISA Section 702)' },
  'section 702': { id: '118/hr/7888', title: 'Reforming Intelligence and Securing America Act (FISA Section 702)' },
  'surveillance': { id: '118/hr/7888', title: 'Reforming Intelligence and Securing America Act (FISA Section 702)' },
  'spying': { id: '118/hr/7888', title: 'Reforming Intelligence and Securing America Act (FISA Section 702)' },
  'nsa spying': { id: '118/hr/7888', title: 'Reforming Intelligence and Securing America Act (FISA Section 702)' },
  'warrantless surveillance': { id: '118/hr/7888', title: 'Reforming Intelligence and Securing America Act (FISA Section 702)' },
  'patriot act': { id: '107/hr/3162', title: 'USA PATRIOT Act' },

  // Tech
  'tiktok ban': { id: '118/hr/7521', title: 'Protecting Americans from Foreign Adversary Controlled Applications Act' },
  'tiktok': { id: '118/hr/7521', title: 'Protecting Americans from Foreign Adversary Controlled Applications Act' },
  'ban tiktok': { id: '118/hr/7521', title: 'Protecting Americans from Foreign Adversary Controlled Applications Act' },
  'chips act': { id: '117/hr/4346', title: 'CHIPS and Science Act' },
  'chips': { id: '117/hr/4346', title: 'CHIPS and Science Act' },
  'semiconductors': { id: '117/hr/4346', title: 'CHIPS and Science Act' },
  'ai regulation': { id: '119/s/1555', title: 'AI Disclosure Act' },
  'artificial intelligence': { id: '119/s/1555', title: 'AI Disclosure Act' },
  'net neutrality': { id: '118/hr/1567', title: 'Save the Internet Act' },

  // Healthcare
  'affordable care act': { id: '111/hr/3590', title: 'Patient Protection and Affordable Care Act' },
  'obamacare': { id: '111/hr/3590', title: 'Patient Protection and Affordable Care Act' },
  'aca': { id: '111/hr/3590', title: 'Patient Protection and Affordable Care Act' },
  'healthcare': { id: '111/hr/3590', title: 'Patient Protection and Affordable Care Act' },
  'health insurance': { id: '111/hr/3590', title: 'Patient Protection and Affordable Care Act' },
  'drug prices': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'insulin price': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'medicare': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'social security': { id: '119/hr/82', title: 'Social Security Fairness Act' },

  // Immigration / Border
  'secure the border act': { id: '118/hr/2', title: 'Secure the Border Act of 2023' },
  'border bill': { id: '118/hr/2', title: 'Secure the Border Act of 2023' },
  'border wall': { id: '118/hr/2', title: 'Secure the Border Act of 2023' },
  'immigration': { id: '118/hr/2', title: 'Secure the Border Act of 2023' },
  'deportation': { id: '118/hr/2', title: 'Secure the Border Act of 2023' },
  'asylum': { id: '118/hr/2', title: 'Secure the Border Act of 2023' },
  'migrants': { id: '118/hr/2', title: 'Secure the Border Act of 2023' },
  'illegal immigration': { id: '118/hr/2', title: 'Secure the Border Act of 2023' },

  // Economy / Spending
  'infrastructure bill': { id: '117/hr/3684', title: 'Infrastructure Investment and Jobs Act' },
  'infrastructure': { id: '117/hr/3684', title: 'Infrastructure Investment and Jobs Act' },
  'inflation reduction act': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'build back better': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'debt ceiling': { id: '118/hr/3746', title: 'Fiscal Responsibility Act of 2023' },
  'national debt': { id: '118/hr/3746', title: 'Fiscal Responsibility Act of 2023' },
  'government shutdown': { id: '118/hr/3746', title: 'Fiscal Responsibility Act of 2023' },
  'tariffs': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'trade war': { id: '119/hr/1', title: 'One Big Beautiful Bill Act (H.R. 1)' },
  'minimum wage': { id: '117/hr/603', title: 'Raise the Wage Act of 2021' },
  '15 dollar minimum wage': { id: '117/hr/603', title: 'Raise the Wage Act of 2021' },

  // Education
  'student loans': { id: '118/hr/6585', title: 'Student Loan Relief Act' },
  'student debt': { id: '118/hr/6585', title: 'Student Loan Relief Act' },
  'loan forgiveness': { id: '118/hr/6585', title: 'Student Loan Relief Act' },

  // Guns
  'gun control': { id: '117/hr/1808', title: 'Assault Weapons Ban of 2022' },
  'assault weapons ban': { id: '117/hr/1808', title: 'Assault Weapons Ban of 2022' },
  'gun bill': { id: '117/hr/1808', title: 'Assault Weapons Ban of 2022' },
  'second amendment': { id: '117/hr/1808', title: 'Assault Weapons Ban of 2022' },
  'mass shootings': { id: '117/hr/1808', title: 'Assault Weapons Ban of 2022' },
  'red flag law': { id: '117/s/2938', title: 'Bipartisan Safer Communities Act' },
  'gun safety': { id: '117/s/2938', title: 'Bipartisan Safer Communities Act' },

  // Social Issues
  'abortion': { id: '118/hr/431', title: 'Born-Alive Abortion Survivors Protection Act' },
  'roe v wade': { id: '117/hr/3755', title: 'Women\'s Health Protection Act of 2022' },
  'respect for marriage act': { id: '117/hr/8404', title: 'Respect for Marriage Act' },
  'gay marriage': { id: '117/hr/8404', title: 'Respect for Marriage Act' },
  'same sex marriage': { id: '117/hr/8404', title: 'Respect for Marriage Act' },
  'marijuana': { id: '118/hr/4020', title: 'Strengthening the Tenth Amendment Through Entrusting States (STATES) Act' },
  'cannabis': { id: '118/hr/4020', title: 'Strengthening the Tenth Amendment Through Entrusting States (STATES) Act' },
  'weed': { id: '118/hr/4020', title: 'Strengthening the Tenth Amendment Through Entrusting States (STATES) Act' },
  'legalize weed': { id: '118/hr/4020', title: 'Strengthening the Tenth Amendment Through Entrusting States (STATES) Act' },

  // Defense / Foreign Affairs
  'ndaa': { id: '119/s/2296', title: 'National Defense Authorization Act for Fiscal Year 2026' },
  'defense bill': { id: '119/s/2296', title: 'National Defense Authorization Act for Fiscal Year 2026' },
  'military spending': { id: '119/s/2296', title: 'National Defense Authorization Act for Fiscal Year 2026' },
  'ukraine': { id: '118/hr/815', title: 'National Security Supplemental Appropriations Act' },
  'ukraine aid': { id: '118/hr/815', title: 'National Security Supplemental Appropriations Act' },
  'israel aid': { id: '118/hr/815', title: 'National Security Supplemental Appropriations Act' },
  'foreign aid': { id: '118/hr/815', title: 'National Security Supplemental Appropriations Act' },
  'taiwan': { id: '118/hr/815', title: 'National Security Supplemental Appropriations Act' },

  // Energy / Climate
  'climate change': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'green energy': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'electric vehicles': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'ev tax credit': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'solar': { id: '117/hr/5376', title: 'Inflation Reduction Act of 2022' },
  'oil drilling': { id: '119/hr/26', title: 'Protecting American Energy Production Act' },
  'drilling': { id: '119/hr/26', title: 'Protecting American Energy Production Act' },
  'keystone pipeline': { id: '119/hr/26', title: 'Protecting American Energy Production Act' },

  // Jan 6 / Democracy
  'jan 6': { id: '117/hr/3233', title: 'National Commission to Investigate the January 6 Attack Act' },
  'january 6': { id: '117/hr/3233', title: 'National Commission to Investigate the January 6 Attack Act' },
  'insurrection': { id: '117/hr/3233', title: 'National Commission to Investigate the January 6 Attack Act' },
  'electoral count': { id: '117/hr/8873', title: 'Electoral Count Reform Act' },

  // Farm / Agriculture
  'farm bill': { id: '118/hr/8467', title: 'Farm, Food, and National Security Act of 2024' },
  'agriculture': { id: '118/hr/8467', title: 'Farm, Food, and National Security Act of 2024' },
  'farming': { id: '118/hr/8467', title: 'Farm, Food, and National Security Act of 2024' },
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // If it parses as a bill ID (canonical or friendly), skip the search — submit will route directly.
    if (normalizeBillId(query) !== null) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // Check for nickname match
    const lowerQuery = query.toLowerCase();
    const nicknameMatches = Object.entries(BILL_NICKNAMES)
      .filter(([name]) => name.includes(lowerQuery))
      .map(([, bill]) => ({ id: bill.id, title: bill.title, policyArea: 'Popular Name Match', isNickname: true }));

    if (nicknameMatches.length > 0) {
      setResults(nicknameMatches);
      setShowDropdown(true);
      // Don't search Congress.gov if we have a nickname match — avoids overwriting
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bills/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setResults(data.bills || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    // Bill ID (canonical or friendly, e.g. "HR 3684", "H.R. 3684", "hr3684").
    const normalized = normalizeBillId(query.trim());
    if (normalized) {
      router.push(`/bills?id=${normalized}`);
      setShowDropdown(false);
      return;
    }

    // Check nicknames
    const nickname = BILL_NICKNAMES[query.trim().toLowerCase()];
    if (nickname) {
      router.push(`/bills?id=${nickname.id}`);
      setShowDropdown(false);
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setShowDropdown(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search bills (e.g. "infrastructure") or enter bill ID (HR 1234 or 119/hr/1234)'
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Search
        </button>
      </form>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {results.map((bill: any) => (
            <button
              key={bill.id}
              onClick={() => {
                router.push(`/bills?id=${bill.id}`);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-900 text-sm line-clamp-1">{bill.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {bill.id.toUpperCase()}
                {bill.policyArea && ` · ${bill.policyArea}`}
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              router.push(`/search?q=${encodeURIComponent(query)}`);
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-3 text-primary-600 hover:bg-primary-50 text-sm font-medium"
          >
            See all results for &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
