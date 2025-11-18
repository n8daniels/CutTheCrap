# FedDocMCP

Model Context Protocol server for accessing federal legislative documents via Congress.gov API.

## Setup

```bash
pip install -r requirements.txt
```

## Environment Variables

```
CONGRESS_API_KEY=your_api_key_here
```

Get your API key at: https://api.congress.gov/sign-up/

## Usage

```bash
python src/server.py
```

## Available Tools

- `search_bills` - Search for bills by query
- `get_bill_text` - Get full text of a bill
- `get_bill_status` - Get current status of a bill
