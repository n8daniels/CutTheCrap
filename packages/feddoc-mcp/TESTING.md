# Testing FedDocMCP - Simple Instructions

## Current Status
⚠️ **Note**: FedDocMCP is currently in planning phase. Once the code is implemented, follow these instructions to test it.

---

## Prerequisites

Before testing, ensure you have:
1. **Python 3.10+** installed
2. **Congress.gov API key** (get one at https://api.congress.gov/sign-up/)
3. **Claude Desktop** installed (for integration testing)

---

## Quick Start Testing (5 minutes)

### 1. Set Up Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/FedDocMCP.git
cd FedDocMCP

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your API key
export CONGRESS_API_KEY="your_api_key_here"  # On Windows: set CONGRESS_API_KEY=your_api_key_here
```

### 2. Test the Server Starts

```bash
# Run the MCP server
python src/server.py
```

**Expected output:**
```
FedDocMCP server started successfully
Listening for MCP protocol messages...
```

If you see this, the server is working! Press Ctrl+C to stop.

### 3. Test with MCP Inspector (Recommended for Quick Testing)

```bash
# Install MCP Inspector (one-time setup)
npm install -g @modelcontextprotocol/inspector

# Run inspector
mcp-inspector python src/server.py
```

**In the Inspector UI:**
1. You should see 3 tools listed:
   - `search_bills`
   - `get_bill_text`
   - `get_bill_status`

2. **Test search_bills:**
   - Click on "search_bills"
   - Enter parameters:
     ```json
     {
       "query": "climate change",
       "limit": 5
     }
     ```
   - Click "Execute"
   - You should see a list of bills about climate change

3. **Test get_bill_text:**
   - Click on "get_bill_text"
   - Enter parameters:
     ```json
     {
       "congress": 118,
       "bill_type": "hr",
       "bill_number": 1
     }
     ```
   - Click "Execute"
   - You should see the full text of the bill

### 4. Test with Claude Desktop

**Configure Claude Desktop:**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "feddoc": {
      "command": "python",
      "args": ["/full/path/to/FedDocMCP/src/server.py"],
      "env": {
        "CONGRESS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Test in Claude Desktop:**

1. Restart Claude Desktop
2. Look for the 🔌 icon (indicates MCP server connected)
3. Try these queries:
   - "Search for bills about artificial intelligence from the 118th Congress"
   - "Get the text of H.R. 1 from the 118th Congress"
   - "Show me the status of S. 100 from the 118th Congress"

**Expected behavior:** Claude should use your FedDocMCP tools to fetch real congressional data.

---

## Running Unit Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=src tests/

# Run specific test file
pytest tests/test_bills.py -v
```

**What's being tested:**
- API client functionality
- Tool parameter validation
- Date utility functions
- Error handling
- MCP protocol compliance

---

## Troubleshooting

### Server won't start
- **Check:** Is your API key set? Run `echo $CONGRESS_API_KEY`
- **Check:** Are dependencies installed? Run `pip list | grep mcp`
- **Check:** Look at error messages in the terminal

### No results from search
- **Check:** Is your API key valid? Test it at https://api.congress.gov/v3/bill?api_key=YOUR_KEY
- **Check:** Are you searching for something that exists? Try "infrastructure"
- **Check:** Server logs for API errors

### Claude Desktop not connecting
- **Check:** Did you use the FULL path to server.py in the config?
- **Check:** Did you restart Claude Desktop after changing config?
- **Check:** Look for error messages in Claude Desktop logs

### MCP Inspector shows no tools
- **Check:** Did the server start without errors?
- **Check:** Are tools properly registered in `src/server.py`?
- **Check:** Run `python src/server.py` directly to see startup logs

---

## Test Checklist

Use this checklist to verify everything works:

- [ ] Server starts without errors
- [ ] MCP Inspector shows all 3 tools
- [ ] Can search for bills with keyword query
- [ ] Can search by fiscal year (e.g., fiscal_year: 2024)
- [ ] Can search by congress number (e.g., congress: 118)
- [ ] Can retrieve bill text
- [ ] Can get bill status and action history
- [ ] Claude Desktop connects successfully
- [ ] Claude can answer questions using the tools
- [ ] All pytest tests pass
- [ ] No API errors in logs

---

## Common Test Queries

**For search_bills:**
```
"climate change"
"artificial intelligence"
"infrastructure"
"veterans affairs"
"healthcare"
```

**For get_bill_text:**
```
Congress: 118, Type: "hr", Number: 1
Congress: 117, Type: "s", Number: 1
```

**For get_bill_status:**
```
Congress: 118, Type: "hr", Number: 1
```

---

## Advanced Testing

### Test with Custom Python Client

```python
# examples/test_client.py
import asyncio
from mcp.client import Client
from mcp.client.stdio import stdio_client

async def test_feddoc():
    async with stdio_client("python", ["src/server.py"]) as client:
        # List available tools
        tools = await client.list_tools()
        print(f"Available tools: {[t.name for t in tools]}")

        # Call search_bills
        result = await client.call_tool("search_bills", {
            "query": "climate change",
            "limit": 3
        })
        print(f"Results: {result}")

asyncio.run(test_feddoc())
```

---

## Performance Testing

```bash
# Test response time
time python -c "
import asyncio
from mcp.client import Client
from mcp.client.stdio import stdio_client

async def test():
    async with stdio_client('python', ['src/server.py']) as client:
        result = await client.call_tool('search_bills', {'query': 'test', 'limit': 1})
        print('Done')

asyncio.run(test())
"
```

**Expected:** < 2 seconds for cached results, < 5 seconds for API calls

---

## Getting Help

If testing fails:
1. Check the logs: Look at stderr output from the server
2. Verify API key: Test it directly at api.congress.gov
3. Check dependencies: Run `pip install -r requirements.txt` again
4. Read error messages: They should be helpful and specific
5. File an issue: https://github.com/yourusername/FedDocMCP/issues

---

## Summary

**Quickest test:** Use MCP Inspector (2 minutes)
**Most realistic test:** Use Claude Desktop (5 minutes)
**Most thorough test:** Run pytest suite (1 minute)

All three methods should work perfectly if FedDocMCP is implemented correctly!
