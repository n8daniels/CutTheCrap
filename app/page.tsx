export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          CutTheCrap
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          U.S. bills explained in clean, honest, everyday language.
        </p>
        <p className="text-lg text-text-muted mt-2">
          No jargon. No fog. No nonsense.
        </p>
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-text-secondary">
          We're building a mobile-first platform to help you understand legislation
          with 5th-grade summaries, deep-dive analysis, political lean indicators,
          and verified partisan perspectives.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Plain Language</h3>
          <p className="text-text-secondary text-sm">
            Every bill and section explained in everyday terms that anyone can understand.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Deep Analysis</h3>
          <p className="text-text-secondary text-sm">
            Historical precedent, geopolitical context, and economic implications.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Political Transparency</h3>
          <p className="text-text-secondary text-sm">
            Clear political lean indicators and verified perspectives from both sides.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Mobile-First</h3>
          <p className="text-text-secondary text-sm">
            Designed for your phone with collapsible sections and intuitive navigation.
          </p>
        </div>
      </div>
    </div>
  )
}
