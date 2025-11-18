#!/usr/bin/env python3
"""
FedDocMCP Server - Model Context Protocol server for federal documents
Provides access to Congress.gov API for bill data
"""

import os
import sys
import json
import asyncio
import logging
from typing import Any, Optional
import requests
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('feddoc-mcp')

# Congress API configuration
CONGRESS_API_KEY = os.getenv('CONGRESS_API_KEY', '')
CONGRESS_API_BASE = 'https://api.congress.gov/v3'

if not CONGRESS_API_KEY:
    logger.warning("CONGRESS_API_KEY not set! API calls will fail.")

# Initialize MCP server
app = Server("feddoc-mcp")

def make_congress_request(endpoint: str, params: dict = None) -> dict:
    """Make a request to Congress.gov API"""
    if not CONGRESS_API_KEY:
        return {"error": "CONGRESS_API_KEY not configured"}

    url = f"{CONGRESS_API_BASE}/{endpoint}"
    params = params or {}
    params['api_key'] = CONGRESS_API_KEY
    params['format'] = 'json'

    try:
        logger.info(f"Making request to: {endpoint}")
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Congress API error: {e}")
        return {"error": str(e)}

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available MCP tools"""
    return [
        Tool(
            name="search_bills",
            description="Search for bills in Congress",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "congress": {"type": "number", "description": "Congress number (e.g., 118)"},
                    "limit": {"type": "number", "description": "Max results", "default": 20}
                }
            }
        ),
        Tool(
            name="get_bill_text",
            description="Get full text of a bill",
            inputSchema={
                "type": "object",
                "properties": {
                    "congress": {"type": "number", "description": "Congress number"},
                    "bill_type": {"type": "string", "description": "Bill type (hr, s, etc.)"},
                    "bill_number": {"type": "number", "description": "Bill number"}
                },
                "required": ["congress", "bill_type", "bill_number"]
            }
        ),
        Tool(
            name="get_bill_status",
            description="Get current status and details of a bill",
            inputSchema={
                "type": "object",
                "properties": {
                    "congress": {"type": "number", "description": "Congress number"},
                    "bill_type": {"type": "string", "description": "Bill type (hr, s, etc.)"},
                    "bill_number": {"type": "number", "description": "Bill number"}
                },
                "required": ["congress", "bill_type", "bill_number"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls"""
    logger.info(f"Tool called: {name} with args: {arguments}")

    try:
        if name == "search_bills":
            return await search_bills(arguments)
        elif name == "get_bill_text":
            return await get_bill_text(arguments)
        elif name == "get_bill_status":
            return await get_bill_status(arguments)
        else:
            return [TextContent(type="text", text=json.dumps({"error": f"Unknown tool: {name}"}))]
    except Exception as e:
        logger.error(f"Error in {name}: {e}", exc_info=True)
        return [TextContent(type="text", text=json.dumps({"error": str(e)}))]

async def search_bills(args: dict) -> list[TextContent]:
    """Search for bills"""
    query = args.get('query', '')
    congress = args.get('congress')
    limit = args.get('limit', 20)

    # Build endpoint
    if congress:
        endpoint = f"bill/{congress}"
    else:
        endpoint = "bill"

    params = {
        'limit': limit
    }

    if query:
        params['q'] = query

    result = make_congress_request(endpoint, params)

    return [TextContent(type="text", text=json.dumps(result))]

async def get_bill_text(args: dict) -> list[TextContent]:
    """Get full text of a bill"""
    congress = args['congress']
    bill_type = args['bill_type']
    bill_number = args['bill_number']

    # First get bill details to find text URL
    endpoint = f"bill/{congress}/{bill_type}/{bill_number}"
    bill_data = make_congress_request(endpoint)

    if 'error' in bill_data:
        return [TextContent(type="text", text=json.dumps(bill_data))]

    # Try to get text versions
    text_endpoint = f"bill/{congress}/{bill_type}/{bill_number}/text"
    text_data = make_congress_request(text_endpoint)

    # Combine bill info with text
    result = {
        "id": f"{congress}/{bill_type}/{bill_number}",
        "bill": bill_data.get('bill', {}),
        "text": text_data.get('textVersions', []),
        "format": "json"
    }

    return [TextContent(type="text", text=json.dumps(result))]

async def get_bill_status(args: dict) -> list[TextContent]:
    """Get bill status and details"""
    congress = args['congress']
    bill_type = args['bill_type']
    bill_number = args['bill_number']

    endpoint = f"bill/{congress}/{bill_type}/{bill_number}"
    result = make_congress_request(endpoint)

    if 'error' not in result and 'bill' in result:
        bill = result['bill']
        status_data = {
            "id": f"{congress}/{bill_type}/{bill_number}",
            "title": bill.get('title', ''),
            "status": bill.get('latestAction', {}).get('text', 'Unknown'),
            "last_action": bill.get('latestAction', {}).get('text', ''),
            "last_action_date": bill.get('latestAction', {}).get('actionDate', ''),
            "introduced_date": bill.get('introducedDate', ''),
            "sponsor": bill.get('sponsors', [{}])[0].get('fullName', '') if bill.get('sponsors') else '',
            "full_data": bill
        }
        return [TextContent(type="text", text=json.dumps(status_data))]

    return [TextContent(type="text", text=json.dumps(result))]

async def main():
    """Run the MCP server"""
    logger.info("Starting FedDocMCP server...")

    if not CONGRESS_API_KEY:
        logger.error("CONGRESS_API_KEY environment variable not set!")
        logger.error("Get your API key at: https://api.congress.gov/sign-up/")
        sys.exit(1)

    logger.info("FedDocMCP server ready")

    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
