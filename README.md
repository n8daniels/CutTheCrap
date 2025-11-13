# CutTheCrap

A mobile-first web application that explains U.S. bills, continuing resolutions, policy proposals, and executive orders in clean, honest, everyday language.

**No jargon. No fog. No nonsense.**

## Purpose

CutTheCrap removes the complexity from legislation by providing:

- **5th-grade summaries** for entire bills and individual sections
- **Deep-dive analysis**: historical precedent, geopolitical framing, economic implications, and ideological fingerprints
- **Political transparency**: Clear left-right political lean indicators
- **Economic context**: System tags (capitalist, corporatist, socialist, libertarian, authoritarian)
- **Vote data**: Complete vote maps with party breakdown
- **Verified perspectives**: Partisan authors can add perspectives in dedicated Democratic and Republican panels
- **Mobile-first design**: Collapsible, intuitive layout optimized for phones

## Features

### Core Functionality

- **Bill Header**: Shows bill number, title, sponsor, status, and Congress session
- **Big Picture Card**: Short summary, impact analysis, winners/losers, and "Sneak Index" for hidden riders
- **Section Breakdown**: Collapsible sections with simplified summaries and deep-dive analysis
- **Political Lean Visualization**: Blue-to-red scale showing political positioning
- **Economic Tags**: Clear labeling of economic system characteristics
- **Partisan Takes**: Verified author perspectives from both major parties
- **Vote Maps**: Visual breakdown of votes by party and chamber

### Technical Features

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for responsive design
- PostgreSQL database
- Local LLM analysis via Ollama
- Optional OpenAI integration for premium refinement
- Content caching with SHA-256 hashing
- Comprehensive security measures

## Security

Security is a primary requirement for CutTheCrap. See [SECURITY.md](./SECURITY.md) for detailed security policies.

### Security Measures

- Multi-factor authentication for all contributors
- GitHub security tooling enabled (Dependabot, secret scanning, code scanning)
- Branch protection rules enforced
- No hardcoded API keys or secrets
- Input validation and sanitization
- Rate limiting on all API endpoints
- Security headers (CSP, X-Frame-Options, etc.)
- Least-privilege database access
- Verified author authentication system
- Audit logging

## Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Ollama (for local LLM analysis)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/n8daniels/CutTheCrap.git
   cd CutTheCrap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and configure:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string (min 32 characters)
   - `SESSION_SECRET`: Another secure random string
   - `OLLAMA_BASE_URL`: Ollama server URL (default: http://localhost:11434)
   - Other optional settings

4. **Set up the database**
   ```bash
   # Create the database
   createdb cutthecrap

   # Run the schema
   psql -d cutthecrap -f lib/db/schema.sql
   ```

5. **Install and start Ollama**
   ```bash
   # Install Ollama (see https://ollama.ai)
   # Pull the model
   ollama pull llama2

   # Ollama should be running on http://localhost:11434
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Project Structure

```
/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/              # Utility libraries
│   ├── db/          # Database connection and schema
│   ├── llm/         # LLM integration (Ollama, OpenAI)
│   └── cache.ts     # Content caching system
├── types/           # TypeScript type definitions
├── public/          # Static assets
└── .env.example     # Environment variable template
```

### Key Components

- **BillHeader**: Displays bill metadata and status
- **BigPictureCard**: Shows summary, impact, and Sneak Index
- **BillSection**: Collapsible section with summary and deep-dive
- **PoliticalLeanBar**: Visual political lean indicator
- **EconomicTags**: Economic system characteristic badges
- **PartisanTakes**: Verified partisan perspective panels
- **VoteMap**: Vote breakdown visualization

### Database Schema

See `lib/db/schema.sql` for the complete schema. Key tables:

- `users`: Authentication and verified authors
- `bills`: Bill metadata and summaries
- `bill_sections`: Individual bill sections with analysis
- `votes`: Vote data by chamber
- `partisan_perspectives`: Verified author perspectives
- `content_cache`: Analysis caching
- `audit_log`: Security audit trail

### LLM Integration

The application uses Ollama for local LLM analysis:

- **Summary**: 5th-grade explanations
- **Deep Dive**: Historical context, geopolitical implications, economic framing
- **Ideology**: Score from -5 (socialist) to +5 (libertarian)
- **Lean**: Score from -5 (left) to +5 (right)
- **Economic Tags**: System characteristic identification

Optional OpenAI integration available for premium refinement.

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking

## API Routes

API routes are located in `app/api/`:

- `/api/bills`: Bill management
- `/api/bills/[id]`: Individual bill operations
- `/api/analysis`: LLM analysis endpoints
- `/api/auth`: Authentication and authorization
- `/api/perspectives`: Partisan perspective management

*Note: API routes to be implemented*

## Contributing

1. Enable MFA on your GitHub account
2. Follow security best practices (see SECURITY.md)
3. Never commit secrets or API keys
4. Write tests for new features
5. Ensure type safety with TypeScript
6. Follow the established code style

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Roadmap

### Future Enhancements

- Executive order parsing
- Policy brief reduction
- Historical comparison engine
- Public annotations
- AI chat explainer for any bill
- Mobile apps (iOS, Android)
- Email alerts for bill updates
- API for third-party integrations

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Acknowledgments

Built with transparency and clarity as core principles. Dedicated to making legislation accessible to everyone.
