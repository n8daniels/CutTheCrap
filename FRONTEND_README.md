# CutTheCrap Frontend - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs all Next.js, React, and TypeScript dependencies.

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 3. Test RAG Comparison

Navigate to `/rag-comparison` or click "Try the Demo" on the homepage.

---

## Project Structure

```
CutTheCrap/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   ├── globals.css          # Global styles
│   ├── rag-comparison/      # RAG comparison page
│   └── api/                 # API routes
│       └── rag/
│           └── compare/
│               └── route.ts # RAG comparison API
├── components/              # React components (future)
├── lib/                     # Utility functions (future)
├── public/                  # Static assets
├── scripts/                 # Python integration scripts
│   └── run_rag_comparison.py
├── src/                     # Python RAG system
│   ├── rag/
│   ├── analysis/
│   └── demo/
├── package.json            # Node dependencies
├── tsconfig.json           # TypeScript config
└── tailwind.config.js      # Tailwind CSS config
```

---

## Features

### Homepage (`/`)
- Overview of CutTheCrap platform
- Links to RAG comparison demo
- Tech stack showcase
- Key metrics display

### RAG Comparison (`/rag-comparison`)
- Interactive demo comparing Traditional vs MCP-Enhanced RAG
- Real-time question answering
- Performance metrics visualization
- Sample questions for easy testing

### API Routes (`/api/rag/compare`)
- POST endpoint for RAG comparison
- Integrates with Python RAG system
- Returns metrics from both systems
- Fallback to mock data if Python unavailable

---

## How It Works

### Frontend → Backend Flow

1. **User enters question** in `/rag-comparison`
2. **Frontend calls** `/api/rag/compare` with question and bill ID
3. **API route executes** Python script `scripts/run_rag_comparison.py`
4. **Python script**:
   - Initializes both RAG systems
   - Indexes the requested bill
   - Processes the question
   - Returns metrics
5. **API returns** results to frontend
6. **Frontend displays** comparison metrics

---

## Python Integration

The Next.js frontend connects to the Python RAG backend via:

### API Route (`app/api/rag/compare/route.ts`)
- Executes Python script using `child_process`
- Passes question and bill ID as arguments
- Parses JSON response from Python
- Handles errors gracefully

### Python Script (`scripts/run_rag_comparison.py`)
- Imports RAG systems from `src/rag/`
- Runs comparison
- Outputs JSON to stdout
- Called by Node.js API route

---

## NPM Scripts

```bash
# Development
npm run dev          # Start Next.js dev server (port 3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint

# Python RAG (convenience scripts)
npm run rag:demo     # Run Python RAG demo
npm run rag:verify   # Verify Python setup
```

---

## Environment Variables (Optional)

Create `.env.local` for configuration:

```bash
# OpenAI API Key (for LLM integration)
OPENAI_API_KEY=your_key_here

# Congress.gov API Key (for production FedDocMCP)
CONGRESS_API_KEY=your_key_here
```

---

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend/AI
- **Python 3.11** - RAG implementation
- **sentence-transformers** - Embeddings
- **FAISS** - Vector search
- **NumPy, pandas** - Data processing

---

## Development Tips

### Hot Reload
Next.js automatically reloads when you edit:
- `.tsx`, `.ts` files (frontend)
- API routes

Python files require manual restart.

### Testing RAG Systems

**With Python installed:**
```bash
# Verify Python setup
python verify_setup.py

# Run standalone demo
python src/demo/side_by_side_comparison.py
```

**Without Python installed:**
- Frontend still works!
- API returns mock data
- Shows realistic metrics for demonstration

### Adding New Pages

Create new route:
```bash
app/my-page/page.tsx
```

Access at: `http://localhost:3000/my-page`

### Adding API Routes

Create new API:
```bash
app/api/my-endpoint/route.ts
```

Access at: `http://localhost:3000/api/my-endpoint`

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy!

Note: Python backend runs as serverless functions automatically.

### Docker

```bash
# Build and run
docker-compose up

# Access at http://localhost:3000
```

### Manual Deployment

```bash
npm run build
npm start
```

---

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules .next
npm install
```

### Python script fails
- Check `requirements.txt` installed: `pip install -r requirements.txt`
- Verify Python path: `which python3`
- Check script permissions: `chmod +x scripts/run_rag_comparison.py`

### Port 3000 already in use
```bash
# Use different port
PORT=3001 npm run dev
```

### Styles not loading
```bash
# Rebuild Tailwind
npm run dev
```

---

## Next Steps

### Immediate
- [x] Homepage
- [x] RAG comparison page
- [x] API integration
- [ ] Add more sample bills
- [ ] Improve error handling
- [ ] Add loading animations

### Future Features
- [ ] Document upload
- [ ] Training data collection UI
- [ ] Model fine-tuning interface
- [ ] Analytics dashboard
- [ ] User authentication
- [ ] Multi-user support

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## Support

- **Issues**: [GitHub Issues](https://github.com/n8daniels/CutTheCrap/issues)
- **Docs**: See `RAG_COMPARISON_README.md` for RAG system details
- **Integration**: See `INTEGRATION_GUIDE.md` for platform integration

---

**Built with focus. No fluff, no BS, just a working application.**
