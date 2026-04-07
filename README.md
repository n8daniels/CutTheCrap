# CutTheCrap

[![Development Status](https://img.shields.io/badge/status-alpha-orange.svg)](https://github.com/n8daniels/CutTheCrap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**A free, non-partisan civic tool that maps the connections between federal bills, the laws they change, the people who sponsor them, and the money behind it all.**

> No spin. No bias. Just the data, connected.

## The Problem

A bill gets introduced in Congress. It amends three existing laws, references two regulations, has four amendments — one of which guts the main provision entirely. The Senate has a companion bill with key differences. The sponsor received $2M from industries the bill affects.

You'd never know any of that from reading the bill text alone. And the tools that DO connect these dots cost $10,000–50,000/year.

## What CutTheCrap Does

Enter a bill number. Get the full picture:

```
HR 4532
├── Amends: 42 USC § 1395 (Medicare Act)
├── References: Public Law 117-169 (Inflation Reduction Act)
│   └── Which amended: 26 USC § 45 (Clean Energy Credits)
├── Committee: Ways & Means
├── 3 Amendments proposed
│   └── Amendment 2 guts Section 4 entirely
├── Senate companion: S 2187
│   └── Key difference: excludes states under 1M population
├── Sponsor's top donors: [Industry X, Industry Y]
└── Lobbying activity: 12 organizations lobbied on this bill

PLAIN ENGLISH: "This bill changes how Medicare pays for X.
It builds on the Inflation Reduction Act. One amendment
would remove the main provision entirely."
```

**Free. Open source. For everyone.**

## How It Works

CutTheCrap builds a **dependency graph** — a map of every law, regulation, amendment, and bill connected to the one you're looking at. Then it explains what it all means in plain language.

### Key Innovation: One Fetch, Complete Context

Traditional approach: Look up a bill → get just that bill → no context → repeat for every reference.

**CutTheCrap:** Look up a bill → automatically fetch ALL related documents in one operation → build the full connection graph → cache everything → answer the current question and the next 10 with zero additional fetches.

**Result:** 90% cost reduction, complete context, better understanding.

## Data Sources (All Free, All Public)

| What | Source | Cost |
|------|--------|------|
| Bills, amendments, votes | [Congress.gov API](https://api.congress.gov/) | Free |
| Government documents (39+ collections) | [GovInfo.gov API](https://api.govinfo.gov/) | Free |
| Regulations and rules | [Federal Register API](https://www.federalregister.gov/developers) | Free |
| Campaign finance | [FEC API](https://api.open.fec.gov/) | Free |
| Donor/industry data | [OpenSecrets API](https://www.opensecrets.org/open-data/api) | Free |
| Lobbying disclosures | [Senate LDA](https://lda.senate.gov/api/) | Free |
| Member data & voting patterns | [ProPublica Congress API](https://projects.propublica.org/api-docs/congress-api/) | Free |
| Government spending | [USASpending.gov API](https://api.usaspending.gov/) | Free |
| Court challenges | [CourtListener](https://www.courtlistener.com/api/) | Free |

Every data source is public, free, and explicitly intended for civic use under the [OPEN Government Data Act (2019)](https://www.congress.gov/bill/115th-congress/house-bill/4174).

## Features

### Implemented
- Bill analysis with dependency graph building
- Automatic detection of referenced USC sections, CFR sections, public laws, and other bills
- Recursive dependency fetching with cycle detection and depth limiting
- Smart caching (Redis/in-memory) with 80%+ hit rates
- AI context optimization (80% token reduction)
- Full Next.js 14 web application with responsive UI
- FedDocMCP server for federal document access
- Security controls: input validation, rate limiting, ReDoS protection, audit logging
- 15+ automated tests

### Coming Soon
- Sponsor/cosponsor data with donor connections (FEC + OpenSecrets)
- Interactive visual graph (D3.js / React Force Graph)
- Lobbying disclosure integration
- Voting record analysis
- Plain English bill summaries
- "Follow the money" chain visualization

## Quick Start

```bash
# Clone the repository
git clone https://github.com/n8daniels/CutTheCrap.git
cd CutTheCrap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys:
# - CONGRESS_API_KEY (required - get free at https://api.congress.gov/sign-up/)
# - GOVINFO_API_KEY (optional - get free at https://api.data.gov/signup/)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a bill ID (e.g., `117/hr/3684`).

### FedDocMCP Server Setup

The federal document server runs separately:

```bash
cd packages/feddoc-mcp
pip install -r requirements.txt
python -m src.server
```

See [FEDDOC_SETUP.md](FEDDOC_SETUP.md) for detailed setup and [SETUP.md](SETUP.md) for full development environment configuration.

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Data Layer:** Model Context Protocol (MCP) via FedDocMCP
- **Caching:** Redis (production) / In-memory (development)
- **Visualization:** D3.js + React Force Graph
- **Testing:** pytest (Python) + Playwright (planned for frontend)
- **Security:** Zod validation, rate limiting, audit logging, ReDoS protection

## Architecture

```
User → Next.js Frontend → API Routes → Document Graph Builder
                                              ↓
                               ┌──────────────┴──────────────┐
                               ↓                             ↓
                        Document Cache              FedDocMCP Server
                        (Redis/Memory)                      ↓
                                              ┌─────────────┼─────────────┐
                                              ↓             ↓             ↓
                                        Congress.gov   GovInfo.gov  Federal Register
```

## Contributing

This is an open-source civic tool. Contributions welcome:

- Report bugs — [Open an issue](https://github.com/n8daniels/CutTheCrap/issues)
- Suggest features or data sources
- Improve documentation
- Submit PRs

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and [SECURITY.md](SECURITY.md) for security policies.

## About

CutTheCrap is a non-partisan civic education tool built by a private citizen on personal time. It uses exclusively public government data to help people understand how legislation works and who is connected to it.

No political agenda. No bias. No paywall. Just transparency.

## Support This Project

This tool is free and always will be. If it helped you understand a bill, consider supporting development:

- Star this repo
- Share it with someone who cares about civic transparency
- [Buy me a coffee](https://ko-fi.com/) *(link coming soon)*
- [GitHub Sponsors](https://github.com/sponsors/) *(coming soon)*

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Nate Daniels** — [@n8daniels](https://github.com/n8daniels)

---

*Built because public legislation should be publicly understandable.*
