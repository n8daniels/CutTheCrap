# Troubleshooting Guide

This guide helps you solve common issues with FedDocMCP.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Issues](#configuration-issues)
- [API Issues](#api-issues)
- [MCP Client Issues](#mcp-client-issues)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)

## Installation Issues

### Python Version Error

**Error:**
```
Python 3.10 or higher is required
```

**Solution:**
1. Check your Python version:
   ```bash
   python --version
   ```

2. If < 3.10, install Python 3.10+:
   - **macOS**: `brew install python@3.10`
   - **Windows**: Download from python.org
   - **Linux**: `sudo apt install python3.10`

3. Use the correct Python:
   ```bash
   python3.10 -m venv venv
   ```

### Module Not Found Error

**Error:**
```
ModuleNotFoundError: No module named 'mcp'
```

**Solution:**
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate      # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Permission Denied Error

**Error:**
```
Permission denied: '/usr/local/...'
```

**Solution:**
```bash
# Use virtual environment (recommended)
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# OR use --user flag
pip install --user -r requirements.txt
```

## Configuration Issues

### Missing API Key

**Error:**
```
ValueError: CONGRESS_API_KEY is required
```

**Solutions:**

1. **Check .env file exists:**
   ```bash
   ls -la .env
   ```
   If not found:
   ```bash
   cp .env.example .env
   ```

2. **Add API key to .env:**
   ```
   CONGRESS_API_KEY=your_actual_api_key_here
   ```

3. **Verify no extra spaces:**
   ```
   # Good
   CONGRESS_API_KEY=abc123xyz

   # Bad (has spaces)
   CONGRESS_API_KEY = abc123xyz
   CONGRESS_API_KEY=abc123xyz
   ```

### Invalid API Key

**Error:**
```
APIError: 401 Unauthorized - Invalid API key
```

**Solutions:**

1. **Verify API key is correct:**
   - Check the email from Congress.gov
   - Copy the key exactly (no spaces)
   - It should be a long alphanumeric string

2. **Test API key manually:**
   ```bash
   curl "https://api.congress.gov/v3/bill?api_key=YOUR_KEY&limit=1"
   ```

3. **Get a new API key:**
   - Visit https://api.congress.gov/sign-up/
   - Request a new key
   - Update .env file

### Environment Not Loading

**Error:**
```
Config values are None or default
```

**Solutions:**

1. **Check .env location:**
   ```bash
   # Should be in project root
   ls -la .env
   ```

2. **Verify python-dotenv is installed:**
   ```bash
   pip install python-dotenv
   ```

3. **Test loading:**
   ```python
   from dotenv import load_dotenv
   import os

   load_dotenv()
   print(os.getenv("CONGRESS_API_KEY"))
   ```

## API Issues

### Rate Limit Exceeded

**Error:**
```
APIError: 429 Too Many Requests - Rate limit exceeded
```

**What happened:**
You made more than 5,000 requests in one hour.

**Solutions:**

1. **Wait for limit to reset:**
   - Limits reset every hour
   - Wait and try again

2. **Reduce request frequency:**
   - Use more specific queries
   - Request smaller result sets
   - Implement caching

3. **Check for request loops:**
   - Make sure you're not making requests in a loop
   - Review your code for inefficiencies

### Connection Timeout

**Error:**
```
requests.exceptions.Timeout: Connection timeout
```

**Solutions:**

1. **Check internet connection:**
   ```bash
   ping api.congress.gov
   ```

2. **Check Congress.gov API status:**
   - Visit https://api.congress.gov/
   - Check if API is operational

3. **Increase timeout:**
   ```python
   response = requests.get(url, timeout=30)  # 30 seconds
   ```

### SSL Certificate Error

**Error:**
```
SSLError: Certificate verification failed
```

**Solutions:**

1. **Update certifi:**
   ```bash
   pip install --upgrade certifi
   ```

2. **Check system time:**
   - Incorrect system time can cause SSL errors
   - Verify your system clock is correct

3. **Temporary workaround (not recommended for production):**
   ```python
   response = requests.get(url, verify=False)
   ```

## MCP Client Issues

### Server Not Appearing

**Problem:**
FedDocMCP tools don't appear in your MCP client.

**Solutions:**

1. **Verify config file location:**
   - Consult your specific MCP client's documentation for the configuration file location
   - Common patterns: `~/Library/Application Support/[Client]/config.json` (macOS) or `%APPDATA%\[Client]\config.json` (Windows)

2. **Check JSON syntax:**
   ```json
   {
     "mcpServers": {
       "feddocmcp": {
         "command": "python",
         "args": ["/absolute/path/to/FedDocMCP/src/server.py"],
         "env": {
           "CONGRESS_API_KEY": "your_key_here"
         }
       }
     }
   }
   ```

3. **Validate JSON:**
   - Use https://jsonlint.com/
   - Check for missing commas, brackets, quotes

4. **Use absolute paths:**
   ```bash
   # Find absolute path
   cd /path/to/FedDocMCP
   pwd
   # Copy the output and use in config
   ```

5. **Restart your MCP client:**
   - Quit completely (not just close window)
   - Reopen your MCP client

### Server Crashes on Start

**Problem:**
Server starts but immediately crashes.

**Solutions:**

1. **Check server logs:**
   - Check your MCP client's logs directory (location varies by client)
   - Look for logs related to mcp-server-feddocmcp

2. **Test server manually:**
   ```bash
   cd /path/to/FedDocMCP
   source venv/bin/activate
   python src/server.py
   ```

3. **Common issues:**
   - Missing dependencies: `pip install -r requirements.txt`
   - Wrong Python version: Use Python 3.10+
   - Missing API key: Add to .env

4. **Check Python command:**
   ```json
   {
     "mcpServers": {
       "feddocmcp": {
         "command": "python3",  // Try python3 instead of python
         ...
       }
     }
   }
   ```

### Tools Not Working

**Problem:**
Server appears but tools fail when used.

**Solutions:**

1. **Check API key in config:**
   ```json
   {
     "mcpServers": {
       "feddocmcp": {
         "env": {
           "CONGRESS_API_KEY": "verify_this_is_correct"
         }
       }
     }
   }
   ```

2. **Check server logs** for error messages

3. **Test API connectivity:**
   ```bash
   curl "https://api.congress.gov/v3/bill?api_key=YOUR_KEY&limit=1"
   ```

4. **Restart both:**
   - Restart your MCP client
   - Server will restart automatically

## Runtime Errors

### JSON Decode Error

**Error:**
```
JSONDecodeError: Expecting value
```

**Possible Causes:**

1. **API returned non-JSON:**
   - API might be down
   - Rate limit might return HTML error page

2. **Empty response:**
   - Check if API endpoint exists
   - Verify parameters are correct

**Solutions:**

1. **Add response validation:**
   ```python
   response = requests.get(url)
   if response.status_code == 200:
       try:
           data = response.json()
       except JSONDecodeError:
           logger.error(f"Invalid JSON: {response.text}")
   ```

2. **Check API status:**
   - Visit https://api.congress.gov/
   - Test endpoint manually

### Import Error

**Error:**
```
ImportError: cannot import name 'X' from 'Y'
```

**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   pip install -r requirements.txt --force-reinstall
   ```

2. **Check Python path:**
   ```python
   import sys
   print(sys.path)
   ```

3. **Verify package versions:**
   ```bash
   pip list
   ```

### Type Error

**Error:**
```
TypeError: 'NoneType' object is not subscriptable
```

**Common Causes:**

1. **API returned None:**
   ```python
   # Bad
   results = api.search_bills(query)
   first = results[0]  # Error if results is None

   # Good
   results = api.search_bills(query)
   if results:
       first = results[0]
   ```

2. **Missing validation:**
   ```python
   # Add type checks
   if not isinstance(results, list):
       logger.error("Expected list, got None")
       return []
   ```

## Performance Issues

### Slow Response Times

**Problem:**
Tools take a long time to respond.

**Possible Causes:**

1. **Network latency**
2. **Large result sets**
3. **Rate limiting delays**

**Solutions:**

1. **Reduce result size:**
   ```
   # Instead of
   "Search for bills about climate" (might return 100s)

   # Use
   "Search for bills about climate, limit to 10 results"
   ```

2. **Use more specific queries:**
   ```
   # Specific
   "Search for H.R. 1234 from 118th Congress"

   # Less specific (slower)
   "Search for all bills"
   ```

3. **Check network:**
   ```bash
   ping api.congress.gov
   traceroute api.congress.gov
   ```

### Memory Issues

**Error:**
```
MemoryError: Unable to allocate...
```

**Solutions:**

1. **Limit result sizes:**
   - Use pagination
   - Request smaller limits
   - Process results in chunks

2. **Increase system memory:**
   - Close other applications
   - Use a machine with more RAM

## Getting More Help

### Collecting Debug Information

When reporting issues, include:

1. **Environment:**
   ```bash
   python --version
   pip list
   uname -a  # macOS/Linux
   ```

2. **Error messages:**
   - Full stack trace
   - Server logs
   - MCP client logs

3. **Configuration:**
   ```json
   // Your MCP client config.json (remove API key!)
   ```

4. **Steps to reproduce:**
   - What you did
   - What you expected
   - What actually happened

### Where to Get Help

1. **Documentation:**
   - [SETUP.md](SETUP.md)
   - [API_KEYS.md](API_KEYS.md)
   - [DEVELOPMENT.md](DEVELOPMENT.md)

2. **GitHub:**
   - [Search existing issues](https://github.com/n8daniels/FedDocMCP/issues)
   - [Open a new issue](https://github.com/n8daniels/FedDocMCP/issues/new)

3. **MCP Resources:**
   - [MCP Documentation](https://modelcontextprotocol.io/)
   - [MCP GitHub](https://github.com/modelcontextprotocol)

### Enabling Debug Logging

Add to `.env`:
```
LOG_LEVEL=DEBUG
```

Or in your MCP client config:
```json
{
  "mcpServers": {
    "feddocmcp": {
      "env": {
        "CONGRESS_API_KEY": "your_key",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

This will provide more detailed logs for troubleshooting.

---

**Still stuck?** Open an issue on GitHub with:
- Error message
- Environment details
- Steps to reproduce
- What you've tried
