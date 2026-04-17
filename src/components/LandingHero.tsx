'use client';

import { useEffect, useRef, useState } from 'react';

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.2) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingHero({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="bg-white">
      {/* Section 1: The Hook — Two Real Bills */}
      <section className="min-h-[85vh] flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <p className="text-primary-400 font-semibold tracking-widest uppercase text-sm mb-10">
              Both sides. Same game.
            </p>
          </FadeIn>

          {/* Bill 1 — Republican / Oil & Gas */}
          <FadeIn delay={200}>
            <div className="mb-10 text-left sm:text-center">
              <p className="text-lg sm:text-xl text-gray-400 mb-2">
                <a href="/bills?id=119/hr/26" className="text-primary-400 hover:text-primary-300 underline decoration-primary-400/30 hover:decoration-primary-300 transition-colors">H.R. 26</a> bans moratoriums on oil &amp; gas drilling on federal land.
              </p>
              <p className="text-xl sm:text-2xl text-gray-200 leading-relaxed">
                Its sponsor is the <span className="text-green-400 font-bold">#1 recipient of oil &amp; gas money</span> in Congress.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={500}>
            <div className="text-gray-600 text-2xl mb-10">&#x2022; &#x2022; &#x2022;</div>
          </FadeIn>

          {/* Bill 2 — Democrat / Pharma */}
          <FadeIn delay={700}>
            <div className="mb-10 text-left sm:text-center">
              <p className="text-lg sm:text-xl text-gray-400 mb-2">
                <a href="/bills?id=119/hr/946" className="text-primary-400 hover:text-primary-300 underline decoration-primary-400/30 hover:decoration-primary-300 transition-colors">H.R. 946</a> shields certain drugs from Medicare price negotiation.
              </p>
              <p className="text-xl sm:text-2xl text-gray-200 leading-relaxed">
                Its sponsor received <span className="text-green-400 font-bold">$133,000+ from Big Pharma</span> last cycle.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={1000}>
            <p className="text-lg text-gray-500 mt-6 italic">
              You&rsquo;d never know any of this from reading the bills alone.
            </p>
          </FadeIn>

          <FadeIn delay={1200}>
            <p className="text-sm text-gray-600 mt-4">
              Don&rsquo;t take our word for it &mdash; <a href="/bills?id=119/hr/26" className="text-primary-400 hover:underline">click</a> and see for yourself.
            </p>
          </FadeIn>

          <FadeIn delay={1400}>
            <div className="mt-12 animate-bounce text-gray-500">
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section 2: The Barrier */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
              The tools that connect these dots?
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 w-full sm:w-56 text-center">
                <p className="text-3xl font-bold text-red-600">$10,000</p>
                <p className="text-sm text-gray-500 mt-1">per year — basic</p>
              </div>
              <div className="text-2xl text-gray-300 hidden sm:block">to</div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 w-full sm:w-56 text-center">
                <p className="text-3xl font-bold text-red-600">$50,000</p>
                <p className="text-sm text-gray-500 mt-1">per year — full access</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <p className="text-xl text-gray-600 leading-relaxed">
              Built for lobbyists and insiders. Not for you.<br />
              <span className="text-gray-900 font-semibold">Until now.</span>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Section 3: The Solution */}
      <section className="py-20 sm:py-28 px-4 bg-gradient-to-b from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              CutTheCrap
            </h2>
            <p className="text-xl sm:text-2xl text-primary-100 mb-12 max-w-2xl mx-auto">
              Enter a bill. See who&rsquo;s behind it. Follow the money. Understand what it actually does.
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-3xl mb-3">&#x1F4CB;</div>
                <h3 className="font-bold text-lg mb-2">What It Does</h3>
                <p className="text-primary-100 text-sm">Plain-English AI summaries. What laws it changes. What amendments gut the main provision.</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-3xl mb-3">&#x1F4B0;</div>
                <h3 className="font-bold text-lg mb-2">Who Pays</h3>
                <p className="text-primary-100 text-sm">Sponsor donor data from the FEC. PAC spending. Industry connections. Follow every dollar.</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-3xl mb-3">&#x1F517;</div>
                <h3 className="font-bold text-lg mb-2">How It Connects</h3>
                <p className="text-primary-100 text-sm">Related bills. Companion legislation. Regulations affected. The full web of influence.</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <p className="mt-12 text-2xl font-bold">
              Free. Open source. Forever.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Section 4: Who It's For */}
      <section className="py-20 sm:py-28 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
              Built for everyone who deserves to know
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <FadeIn delay={100}>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Journalists</h3>
                <p className="text-gray-600 text-sm">Connect bills to money in seconds, not days. Find the story behind the legislation.</p>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Voters</h3>
                <p className="text-gray-600 text-sm">See what your representatives actually do — and who they do it for.</p>
              </div>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Educators</h3>
                <p className="text-gray-600 text-sm">Teach civics with real data. Show students how legislation actually works.</p>
              </div>
            </FadeIn>
            <FadeIn delay={400}>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Activists</h3>
                <p className="text-gray-600 text-sm">Track the bills that matter to your cause. See who&rsquo;s fighting for — or against — you.</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Section 5: The Comparison */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
              What you get vs. what lobbyists get
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-xl p-6 bg-gray-100 border border-gray-200">
                <h3 className="font-bold text-gray-500 mb-4 text-sm uppercase tracking-wide">Congress.gov</h3>
                <ul className="space-y-3 text-gray-600 text-sm">
                  <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">&#x2022;</span> Raw bill text</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">&#x2022;</span> Sponsor name</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">&#x2022;</span> Status updates</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">&#x2022;</span> That&rsquo;s it</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 bg-primary-50 border-2 border-primary-400">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-primary-700 text-sm uppercase tracking-wide">CutTheCrap</h3>
                  <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full font-semibold">FREE</span>
                </div>
                <ul className="space-y-3 text-gray-700 text-sm">
                  <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">&#x2713;</span> AI-powered plain-English summaries</li>
                  <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">&#x2713;</span> Sponsor donor data from FEC</li>
                  <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">&#x2713;</span> PAC &amp; outside spending</li>
                  <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">&#x2713;</span> Related bills &amp; amendments</li>
                  <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">&#x2713;</span> Federal regulations affected</li>
                  <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">&#x2713;</span> Connection graphs</li>
                  <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">&#x2713;</span> Left &amp; right impact analysis</li>
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section 6: CTA */}
      <section className="py-20 sm:py-28 px-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Democracy shouldn&rsquo;t have a paywall.
            </h2>
            <p className="text-lg text-gray-400 mb-10">
              Search any bill. See the full picture. Share it with everyone.
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <button
              onClick={onEnter}
              className="inline-block px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-primary-600/30"
            >
              Start searching bills
            </button>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400">
              <a href="https://github.com/n8daniels/CutTheCrap" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Open source on GitHub
              </a>
              <span className="hidden sm:inline text-gray-600">|</span>
              <span>Non-partisan</span>
              <span className="hidden sm:inline text-gray-600">|</span>
              <span>100% public data</span>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
