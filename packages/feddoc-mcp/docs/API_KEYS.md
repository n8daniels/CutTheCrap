# Congress.gov API Keys

This guide covers everything you need to know about getting and managing your Congress.gov API key.

## What is the Congress.gov API?

Congress.gov provides free public access to U.S. Congressional data through their official API. The API gives programmatic access to:

- Bills and resolutions
- Congressional records
- Member information
- Committee data
- Nominations and treaties
- And much more

## Getting Your API Key

### Step 1: Visit the Sign-Up Page

Go to: https://api.congress.gov/sign-up/

### Step 2: Fill Out the Form

Provide:
- **Email address**: Where they'll send your API key
- **First name**
- **Last name**
- **Organization** (optional): Can be "Personal" or "Individual"

### Step 3: Check Your Email

You'll receive an email with:
- Your unique API key
- API documentation link
- Usage guidelines

**Important:** The email might go to spam - check there if you don't see it.

### Step 4: Save Your API Key

Your API key will look something like:
```
abc123xyz789def456ghi789
```

Keep it somewhere safe! You'll need it to configure FedDocMCP.

## API Key Limits

### Rate Limits

- **5,000 requests per hour** per API key
- Resets every hour
- FedDocMCP includes automatic rate limiting

### Usage Guidelines

The API is free for:
- Research and analysis
- Educational purposes
- Non-commercial applications
- Commercial applications

**You should:**
- Attribute data to Congress.gov
- Respect rate limits
- Use caching when appropriate

**You should not:**
- Share your API key publicly
- Commit API keys to version control
- Use multiple keys to bypass rate limits
- Make unnecessary requests

## Configuring FedDocMCP

### Option 1: Environment File (.env)

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env`:
   ```
   CONGRESS_API_KEY=your_actual_api_key_here
   ```

3. Never commit `.env` to git (it's in `.gitignore`)

### Option 2: Claude Desktop Config

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "feddocmcp": {
      "command": "python",
      "args": ["/path/to/FedDocMCP/src/server.py"],
      "env": {
        "CONGRESS_API_KEY": "your_actual_api_key_here"
      }
    }
  }
}
```

### Option 3: System Environment Variable

**macOS/Linux (.bashrc or .zshrc):**
```bash
export CONGRESS_API_KEY="your_actual_api_key_here"
```

**Windows (PowerShell):**
```powershell
$env:CONGRESS_API_KEY="your_actual_api_key_here"
```

## Security Best Practices

### DO:
- ✅ Keep API keys in `.env` files (not committed to git)
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Use different keys for different projects
- ✅ Keep keys out of screenshots and logs

### DON'T:
- ❌ Commit API keys to version control
- ❌ Share API keys in public forums
- ❌ Hardcode API keys in source code
- ❌ Include API keys in error messages
- ❌ Post API keys in bug reports

## Testing Your API Key

### Manual Test

Use curl to test your API key:

```bash
curl "https://api.congress.gov/v3/bill?api_key=YOUR_API_KEY&limit=1"
```

If it works, you'll see JSON data about recent bills.

### Test with FedDocMCP

```bash
# Make sure .env has your API key
python src/server.py
```

No errors = API key is working!

## Monitoring Usage

Congress.gov doesn't provide a usage dashboard, but you can:

1. **Track requests locally**: FedDocMCP logs all API calls
2. **Monitor rate limit headers**: Check HTTP response headers
3. **Implement your own tracking**: Count requests in your application

## Troubleshooting

### "Invalid API key" Error

**Possible causes:**
- Typo in the API key
- Extra spaces before/after the key
- Using email instead of API key
- API key not activated yet (check email)

**Solution:**
1. Copy the API key directly from the email
2. Paste it carefully into `.env`
3. Make sure there are no spaces or quotes

### "Rate limit exceeded"

**What happened:**
You made more than 5,000 requests in one hour.

**Solution:**
- Wait until the next hour
- Implement caching
- Reduce request frequency
- Use more specific queries

### "Authentication failed"

**Possible causes:**
- Environment variable not set
- `.env` file not in the right location
- Configuration not loaded

**Solution:**
1. Check `.env` exists in project root
2. Verify `CONGRESS_API_KEY` is set
3. Restart the server

## Getting a New API Key

If you lose your API key or need another one:

1. Go to https://api.congress.gov/sign-up/
2. Use the same or different email
3. You can have multiple API keys

## API Key Rotation

For security, rotate your API key periodically:

1. Get a new API key
2. Update `.env` and configs
3. Test with the new key
4. Optionally delete the old key reference

## Additional Resources

- **API Documentation**: https://api.congress.gov/
- **Congress.gov**: https://www.congress.gov/
- **API Status**: Check https://api.congress.gov/ for service status
- **Support**: Contact Congress.gov support for API issues

## FAQs

### Do I need a different API key for development and production?

No, but it's a good practice. You can request multiple API keys.

### Can I share my API key with my team?

You can, but each team member should ideally have their own key for better tracking and security.

### What happens if I commit my API key to GitHub?

1. **Immediately** regenerate a new API key
2. Update all configurations
3. Consider using GitHub's secret scanning
4. Add `.env` to `.gitignore` (already done in FedDocMCP)

### Is there a paid tier with higher limits?

Currently, Congress.gov API is free with 5,000 requests/hour. There's no paid tier.

### Can I use FedDocMCP without an API key?

No, Congress.gov requires an API key for all requests.

---

**Need help?** Open an issue on GitHub or check [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
