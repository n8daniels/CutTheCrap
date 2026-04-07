# FedDocMCP Setup Guide

This guide provides detailed instructions for setting up FedDocMCP.

## Prerequisites

### Required
- **Python 3.10 or higher**: Check with `python --version`
- **Congress.gov API key**: [Sign up here](https://api.congress.gov/sign-up/) - it's free!
- **MCP client**: Any MCP-compatible application

### Recommended
- **Git**: For cloning the repository
- **Virtual environment tool**: venv, virtualenv, or conda

## Installation

### Step 1: Get the Code

#### Option A: Clone the repository (recommended)
```bash
git clone https://github.com/n8daniels/FedDocMCP.git
cd FedDocMCP
```

#### Option B: Download ZIP
1. Go to https://github.com/n8daniels/FedDocMCP
2. Click "Code" → "Download ZIP"
3. Extract and navigate to the folder

### Step 2: Create Virtual Environment

**macOS/Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### Step 3: Install Dependencies

```bash
# Production dependencies
pip install -r requirements.txt

# For development (optional)
pip install -r requirements-dev.txt
```

### Step 4: Configure Environment

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your API key:**
   ```bash
   # On macOS/Linux
   nano .env

   # On Windows
   notepad .env
   ```

3. **Add your API key:**
   ```
   CONGRESS_API_KEY=your_actual_api_key_here
   ```

### Step 5: Test the Server

```bash
python src/server.py
```

The server should start without errors. Press Ctrl+C to stop.

## MCP Client Configuration

### Locate Your Client's Config File

Configuration file locations vary by MCP client. Common examples:

**Example MCP Client (macOS):**
```
~/Library/Application Support/[ClientName]/config.json
```

**Example MCP Client (Windows):**
```
%APPDATA%\[ClientName]\config.json
```

Consult your specific MCP client's documentation for the exact configuration file location.

### Add FedDocMCP

Edit the config file and add:

```json
{
  "mcpServers": {
    "feddocmcp": {
      "command": "python",
      "args": ["/absolute/path/to/FedDocMCP/src/server.py"],
      "env": {
        "CONGRESS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Important:**
- Use the **absolute path** to `server.py`
- Use forward slashes (/) on all platforms
- Make sure Python is in your PATH

### Find the Absolute Path

**macOS/Linux:**
```bash
cd /path/to/FedDocMCP
pwd
# Copy the output and append /src/server.py
```

**Windows:**
```cmd
cd C:\path\to\FedDocMCP
cd
# Copy the output and append \src\server.py
# Then replace backslashes with forward slashes
```

### Example Configurations

**macOS Example:**
```json
{
  "mcpServers": {
    "feddocmcp": {
      "command": "/usr/local/bin/python3",
      "args": ["/Users/yourname/Projects/FedDocMCP/src/server.py"],
      "env": {
        "CONGRESS_API_KEY": "abc123xyz789"
      }
    }
  }
}
```

**Windows Example:**
```json
{
  "mcpServers": {
    "feddocmcp": {
      "command": "python",
      "args": ["C:/Users/yourname/Projects/FedDocMCP/src/server.py"],
      "env": {
        "CONGRESS_API_KEY": "abc123xyz789"
      }
    }
  }
}
```

### Restart Your MCP Client

1. Quit your MCP client completely
2. Reopen your MCP client
3. Look for the FedDocMCP tools

## Verification

### Test in Your MCP Client

Try these queries:

1. "Search for bills about artificial intelligence"
2. "Show me H.R. 1 from the 118th Congress"
3. "What's the status of recent infrastructure bills?"

If the tools work, you're all set!

### Check Server Logs

If something's not working, check the logs:

**macOS/Linux:**
```bash
tail -f ~/.mcp/logs/feddocmcp.log
```

**Windows:**
```cmd
type %APPDATA%\MCP\logs\feddocmcp.log
```

## Troubleshooting

### "Command not found: python"

Try `python3` instead:
```json
{
  "mcpServers": {
    "feddocmcp": {
      "command": "python3",
      ...
    }
  }
}
```

### "No module named 'mcp'"

Activate your virtual environment and reinstall:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### "Invalid API key"

1. Verify your API key at https://api.congress.gov/
2. Check for extra spaces in `.env` or config
3. Make sure you're using the API key, not your email

### "Server not appearing in MCP client"

1. Check the config file path
2. Verify JSON syntax (use a JSON validator)
3. Restart your MCP client completely
4. Check your MCP client's logs

### Still Having Issues?

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or open an issue on GitHub.

## Next Steps

- Read [API_KEYS.md](API_KEYS.md) for API key management
- Check [DEVELOPMENT.md](DEVELOPMENT.md) if you want to contribute
- Review [ARCHITECTURE.md](ARCHITECTURE.md) to understand how it works
- See [examples/](../examples/) for usage examples

## Updating

To update to the latest version:

```bash
cd FedDocMCP
git pull origin main
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt --upgrade
```

Then restart your MCP client.
