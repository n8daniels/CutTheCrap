# FedDocMCP Examples

This directory contains example code demonstrating how to use FedDocMCP.

## Files

### 1. basic_usage.py

Demonstrates basic usage of the CongressAPIClient:
- Searching for bills
- Getting bill details
- Checking bill status
- Using filters

**Run it:**
```bash
cd FedDocMCP
source venv/bin/activate
python examples/basic_usage.py
```

### 2. custom_client.py

Shows how to build custom applications using FedDocMCP as a library:
- LegislativeTracker: Track specific bills
- TopicMonitor: Monitor bills by topic

**Run it:**
```bash
cd FedDocMCP
source venv/bin/activate
python examples/custom_client.py
```

### 3. mcp_client_config.json

Example configuration for MCP clients.

**Use it:**
1. Copy the content
2. Update the path to your FedDocMCP installation
3. Add your API key
4. Paste into your MCP client's config file (location varies by client)

## Prerequisites

Before running examples:

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up API key:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Congress.gov API key
   ```

3. **Verify setup:**
   ```bash
   python src/server.py
   # Should start without errors (Ctrl+C to stop)
   ```

## Understanding the Examples

### Basic Usage Pattern

```python
from clients.congress_api import CongressAPIClient

# Create client
client = CongressAPIClient()

# Search bills
results = client.search_bills(query="climate change", limit=10)

# Get bill details
bill = client.get_bill_details(congress=118, bill_type="hr", bill_number=1)

# Get bill status
status = client.get_bill_status(congress=118, bill_type="hr", bill_number=1)
```

### Building Custom Tools

You can extend the CongressAPIClient to build custom functionality:

```python
class MyCustomTracker:
    def __init__(self):
        self.client = CongressAPIClient()

    def my_custom_function(self):
        # Use client to build custom logic
        results = self.client.search_bills(...)
        # Process results your way
        return processed_results
```

## Common Use Cases

### Use Case 1: Research Assistant

Build a tool to research legislation:

```python
def research_topic(topic: str, congress: int):
    client = CongressAPIClient()
    bills = client.search_bills(query=topic, congress=congress, limit=20)

    # Analyze and summarize
    summary = {
        "total": len(bills),
        "by_type": count_by_type(bills),
        "recent": get_most_recent(bills)
    }

    return summary
```

### Use Case 2: Bill Tracker

Track bills you care about:

```python
def check_bill_updates(tracked_bills: list):
    client = CongressAPIClient()
    updates = []

    for bill in tracked_bills:
        status = client.get_bill_status(
            congress=bill["congress"],
            bill_type=bill["type"],
            bill_number=bill["number"]
        )
        updates.append(status)

    return updates
```

### Use Case 3: Topic Monitoring

Get alerts on specific topics:

```python
def monitor_keywords(keywords: list, congress: int):
    client = CongressAPIClient()
    alerts = []

    for keyword in keywords:
        bills = client.search_bills(query=keyword, congress=congress)

        if bills:
            alerts.append({
                "keyword": keyword,
                "count": len(bills),
                "bills": bills
            })

    return alerts
```

## Tips

1. **Rate Limiting**: Congress.gov API allows 5,000 requests/hour
   - Be mindful when making many requests
   - Implement delays between requests if needed

2. **Error Handling**: Always wrap API calls in try/except
   ```python
   try:
       results = client.search_bills(...)
   except Exception as e:
       print(f"Error: {e}")
   ```

3. **Caching**: For development, consider caching results
   ```python
   import json

   # Cache results
   with open("cache.json", "w") as f:
       json.dump(results, f)

   # Load from cache
   with open("cache.json", "r") as f:
       results = json.load(f)
   ```

4. **Testing**: Mock API calls in tests
   ```python
   from unittest.mock import Mock, patch

   def test_my_function():
       with patch('client.search_bills') as mock:
           mock.return_value = [{"title": "Test"}]
           # Test your function
   ```

## Troubleshooting

### "No module named 'clients'"

Make sure you're running from the project root and src is in the path:

```python
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "src"))
```

### "CONGRESS_API_KEY not found"

Make sure you have a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env and add your API key
```

### API Errors

Check:
1. API key is correct
2. Internet connection is working
3. Congress.gov API is operational (https://api.congress.gov/)

## Next Steps

- Read the [main README](../README.md) for full documentation
- Check [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) for development setup
- See [docs/API_KEYS.md](../docs/API_KEYS.md) for API key help

## Need Help?

- [Troubleshooting Guide](../docs/TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/n8daniels/FedDocMCP/issues)
- [MCP Documentation](https://modelcontextprotocol.io/)
