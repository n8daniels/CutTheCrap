# FedDocMCP Setup Guide

## Quick Start

### 1. Get a Congress.gov API Key

1. Go to https://api.congress.gov/sign-up/
2. Sign up for a free API key
3. Check your email for the API key

### 2. Install Python Dependencies

```bash
cd packages/feddoc-mcp
pip install -r requirements.txt
```

Or if you prefer a virtual environment:

```bash
cd packages/feddoc-mcp
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Congress API key:

```
CONGRESS_API_KEY=your_api_key_here
FEDDOC_MCP_ENABLED=true
```

### 4. Test the MCP Server

Test that the server works:

```bash
cd packages/feddoc-mcp
export CONGRESS_API_KEY=your_api_key_here  # On Windows: set CONGRESS_API_KEY=your_api_key_here
python src/server.py
```

You should see:
```
Starting FedDocMCP server...
FedDocMCP server ready
```

Press Ctrl+C to stop.

### 5. Run CutTheCrap

Now the app should work:

```bash
npm run dev
```

Visit http://localhost:3000 and try searching for a bill like `117/hr/3684`

## Troubleshooting

### "CONGRESS_API_KEY not set"
- Make sure your `.env` file exists in the root directory
- Check that the API key is correct
- Restart the dev server after adding the key

### "Module 'mcp' not found"
- Make sure you installed the Python requirements:
  ```bash
  cd packages/feddoc-mcp
  pip install -r requirements.txt
  ```

### "python: can't open file"
- Verify the path in `.env`: `FEDDOC_MCP_PATH=./packages/feddoc-mcp/src/server.py`
- On Windows, you might need: `FEDDOC_MCP_PATH=.\\packages\\feddoc-mcp\\src\\server.py`

### Bill not found
- Make sure you're using the correct format: `congress/type/number`
- Example: `117/hr/3684` (117th Congress, House Resolution 3684)
- Valid types: `hr`, `s`, `hjres`, `sjres`, `hconres`, `sconres`, `hres`, `sres`

## API Rate Limits

Congress.gov API limits:
- **5000 requests per hour**
- CutTheCrap's caching helps you stay under this limit
- Cache hit rate target: >80%

## Next Steps

Once this is working, consider adding:
1. Better search UX (accept "HR 3684" instead of "117/hr/3684")
2. Bill autocomplete suggestions
3. Recent bills list
4. Bookmark favorite bills
