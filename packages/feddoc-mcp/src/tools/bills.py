"""
Bill-related MCP tools.

Provides tools for searching bills, getting bill text, and tracking bill status.
"""

import logging
from typing import Dict, Any, List

from ..clients.congress_api import CongressAPIClient, APIError


logger = logging.getLogger(__name__)


def format_bill_type(bill_type: str) -> str:
    """
    Format bill type with periods (e.g., 'hr' -> 'H.R.', 's' -> 'S.').

    Args:
        bill_type: Raw bill type string

    Returns:
        Formatted bill type
    """
    bill_type = bill_type.upper()

    # Add periods for multi-letter types
    if len(bill_type) > 1:
        return ".".join(bill_type) + "."
    return bill_type + "."


# Tool Schemas (MCP format)

SEARCH_BILLS_SCHEMA = {
    "name": "search_bills",
    "description": """Search for congressional bills by keyword, congress session, or bill type.

Use this tool to find legislation on specific topics, by congress number, or by bill type.
Returns a list of bills matching the search criteria with basic metadata.
Supports date filtering via fiscal year or explicit date ranges.

Examples:
- "Search for bills about climate change"
- "Find House bills in the 118th Congress"
- "Search for artificial intelligence legislation in fiscal year 2024"
- "Find infrastructure bills from January to June 2023"
""",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search keywords or phrases (required)",
            },
            "congress": {
                "type": "integer",
                "description": "Congress number (e.g., 118 for 118th Congress). Optional.",
                "minimum": 1,
            },
            "bill_type": {
                "type": "string",
                "enum": [
                    "hr",
                    "s",
                    "hjres",
                    "sjres",
                    "hconres",
                    "sconres",
                    "hres",
                    "sres",
                ],
                "description": """Type of bill. Optional. Options:
- hr: House Bill
- s: Senate Bill
- hjres: House Joint Resolution
- sjres: Senate Joint Resolution
- hconres: House Concurrent Resolution
- sconres: Senate Concurrent Resolution
- hres: House Simple Resolution
- sres: Senate Simple Resolution""",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results to return (1-100). Default: 20",
                "minimum": 1,
                "maximum": 100,
                "default": 20,
            },
            "fiscal_year": {
                "type": "integer",
                "description": (
                    "Federal fiscal year (e.g., 2024). Filters to bills "
                    "from Oct 1 - Sep 30. Cannot be used with "
                    "start_date/end_date."
                ),
                "minimum": 1789,
            },
            "start_date": {
                "type": "string",
                "description": (
                    "Start date for filtering bills (ISO format: "
                    "YYYY-MM-DD). Requires end_date. Cannot be used with "
                    "fiscal_year."
                ),
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            },
            "end_date": {
                "type": "string",
                "description": (
                    "End date for filtering bills (ISO format: "
                    "YYYY-MM-DD). Requires start_date. Cannot be used with "
                    "fiscal_year. Max 10-year range."
                ),
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            },
        },
        "required": ["query"],
    },
}


GET_BILL_TEXT_SCHEMA = {
    "name": "get_bill_text",
    "description": """Get the full text of a specific congressional bill.

Retrieves the complete text of a bill, including all sections, amendments, and formatting.
Specify the congress number, bill type, and bill number.

Examples:
- "Get the text of H.R. 1 from the 118th Congress"
- "Show me the full text of S. 234"
- "Retrieve bill text for H.R. 1234 from the 117th Congress"
""",
    "inputSchema": {
        "type": "object",
        "properties": {
            "congress": {
                "type": "integer",
                "description": "Congress number (e.g., 118 for 118th Congress)",
                "minimum": 1,
            },
            "bill_type": {
                "type": "string",
                "enum": [
                    "hr",
                    "s",
                    "hjres",
                    "sjres",
                    "hconres",
                    "sconres",
                    "hres",
                    "sres",
                ],
                "description": "Type of bill (hr, s, hjres, etc.)",
            },
            "bill_number": {
                "type": "integer",
                "description": "Bill number (e.g., 1 for H.R. 1)",
                "minimum": 1,
            },
            "format": {
                "type": "string",
                "enum": ["json", "xml", "pdf"],
                "description": "Format of the bill text. Default: json",
                "default": "json",
            },
        },
        "required": ["congress", "bill_type", "bill_number"],
    },
}


GET_BILL_STATUS_SCHEMA = {
    "name": "get_bill_status",
    "description": """Get the current status and action history of a congressional bill.

Track a bill's progress through the legislative process, including committee referrals,
floor actions, votes, and current status.

Examples:
- "What's the status of H.R. 1 from the 118th Congress?"
- "Show me the action history for S. 234"
- "Track the progress of the infrastructure bill"
""",
    "inputSchema": {
        "type": "object",
        "properties": {
            "congress": {
                "type": "integer",
                "description": "Congress number (e.g., 118 for 118th Congress)",
                "minimum": 1,
            },
            "bill_type": {
                "type": "string",
                "enum": [
                    "hr",
                    "s",
                    "hjres",
                    "sjres",
                    "hconres",
                    "sconres",
                    "hres",
                    "sres",
                ],
                "description": "Type of bill (hr, s, hjres, etc.)",
            },
            "bill_number": {
                "type": "integer",
                "description": "Bill number",
                "minimum": 1,
            },
        },
        "required": ["congress", "bill_type", "bill_number"],
    },
}


# Tool Handlers


async def search_bills_handler(arguments: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Handle search_bills tool calls.

    Args:
        arguments: Tool arguments from MCP client

    Returns:
        List of content blocks for MCP response

    Raises:
        ValueError: If arguments are invalid
        APIError: If API request fails
    """
    # Extract arguments with type assertions
    query: str = arguments.get("query", "")
    congress: int | None = arguments.get("congress")
    bill_type: str | None = arguments.get("bill_type")
    limit: int = arguments.get("limit", 20)
    fiscal_year: int | None = arguments.get("fiscal_year")
    start_date: str | None = arguments.get("start_date")
    end_date: str | None = arguments.get("end_date")

    log_msg = f"search_bills: query='{query}', congress={congress}, type={bill_type}, limit={limit}"
    if fiscal_year:
        log_msg += f", fiscal_year={fiscal_year}"
    if start_date and end_date:
        log_msg += f", date_range={start_date} to {end_date}"
    logger.info(log_msg)

    # Use async context manager for automatic cleanup
    async with CongressAPIClient() as client:
        try:
            # Search bills
            bills = await client.search_bills(
                query=query,
                congress=congress,
                bill_type=bill_type,
                limit=limit,
                fiscal_year=fiscal_year,
                start_date=start_date,
                end_date=end_date,
            )

            # Format results
            if not bills:
                return [{"type": "text", "text": f"No bills found matching '{query}'."}]

            # Build response text
            response_lines = [f"Found {len(bills)} bills matching '{query}':\n"]

            for i, bill in enumerate(bills, 1):
                bill_type_fmt = format_bill_type(bill.get("type", ""))
                bill_id = f"{bill_type_fmt} {bill.get('number', 'N/A')}"
                title = bill.get("title", "No title")
                congress_num = bill.get("congress", "N/A")
                intro_date = bill.get("introducedDate", "N/A")

                response_lines.append(
                    f"{i}. {bill_id} ({congress_num}th Congress)\n"
                    f"   {title}\n"
                    f"   Introduced: {intro_date}\n"
                )

            return [{"type": "text", "text": "\n".join(response_lines)}]

        except ValueError as e:
            logger.error(f"Validation error: {e}")
            return [{"type": "text", "text": f"Error: {str(e)}"}]

        except APIError as e:
            logger.error(f"API error: {e}")
            return [
                {
                    "type": "text",
                    "text": (
                        f"API Error: {str(e)}\n\n"
                        "Please check your API key and internet connection."
                    ),
                }
            ]

        except Exception as e:
            logger.exception("Unexpected error in search_bills_handler")
            return [{"type": "text", "text": f"Unexpected error: {str(e)}"}]


async def get_bill_text_handler(arguments: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Handle get_bill_text tool calls.

    Args:
        arguments: Tool arguments from MCP client

    Returns:
        List of content blocks for MCP response
    """
    # Extract arguments with type checks
    congress: int = arguments.get("congress", 0)
    bill_type: str = arguments.get("bill_type", "")
    bill_number: int = arguments.get("bill_number", 0)
    format_type: str = arguments.get("format", "json")

    # bill_type should always be provided per schema, but check for mypy
    bill_type_str = bill_type if bill_type else "unknown"

    logger.info(
        f"get_bill_text: {bill_type_str.upper()} {bill_number} ({congress}th Congress)"
    )

    async with CongressAPIClient() as client:
        try:
            # Get bill details first
            bill_details = await client.get_bill_details(
                congress, bill_type, bill_number
            )

            # Get bill text
            bill_text_data = await client.get_bill_text(
                congress, bill_type, bill_number, format_type
            )

            # Format response
            # Ensure bill_type is a string for format_bill_type
            bill_type_for_format = str(bill_type) if bill_type else "unknown"
            bill_id = f"{format_bill_type(bill_type_for_format)} {bill_number}"
            title = bill_details.get("title", "No title")

            response_lines = [
                f"Bill Text: {bill_id} ({congress}th Congress)\n",
                f"Title: {title}\n",
                f"Format: {format_type}\n",
                "\n---\n\n",
            ]

            # Add text content
            if format_type == "json":
                text_versions = bill_text_data.get("textVersions", [])
                if text_versions:
                    latest_version = text_versions[0]
                    response_lines.append(
                        f"Version: {latest_version.get('type', 'Unknown')}\n"
                    )
                    response_lines.append(
                        f"Date: {latest_version.get('date', 'Unknown')}\n\n"
                    )

                    # Note: Full text extraction would require additional parsing
                    formats = latest_version.get("formats", [])
                    if formats:
                        response_lines.append("Available formats:\n")
                        for fmt in formats:
                            response_lines.append(
                                f"- {fmt.get('type', 'Unknown')}: {fmt.get('url', 'N/A')}\n"
                            )
                else:
                    response_lines.append("No text versions available yet.\n")
            else:
                response_lines.append(str(bill_text_data))

            return [{"type": "text", "text": "".join(response_lines)}]

        except Exception as e:
            logger.exception("Error in get_bill_text_handler")
            return [{"type": "text", "text": f"Error retrieving bill text: {str(e)}"}]


async def get_bill_status_handler(arguments: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Handle get_bill_status tool calls.

    Args:
        arguments: Tool arguments from MCP client

    Returns:
        List of content blocks for MCP response
    """
    # Extract arguments with type checks
    congress: int = arguments.get("congress", 0)
    bill_type: str = arguments.get("bill_type", "")
    bill_number: int = arguments.get("bill_number", 0)

    # bill_type should always be provided per schema, but check for mypy
    bill_type_str = bill_type if bill_type else "unknown"

    logger.info(
        f"get_bill_status: {bill_type_str.upper()} {bill_number} ({congress}th Congress)"
    )

    async with CongressAPIClient() as client:
        try:
            # Get bill details and status
            bill_details = await client.get_bill_details(
                congress, bill_type, bill_number
            )
            bill_status = await client.get_bill_status(congress, bill_type, bill_number)

            # Format response
            # Ensure bill_type is a string for format_bill_type
            bill_type_for_format = str(bill_type) if bill_type else "unknown"
            bill_id = f"{format_bill_type(bill_type_for_format)} {bill_number}"
            title = bill_details.get("title", "No title")
            sponsor = bill_details.get("sponsor", {})
            sponsor_name = sponsor.get("name", "Unknown") if sponsor else "Unknown"

            latest_action = bill_details.get("latestAction", {})
            latest_action_text = latest_action.get("text", "No recent action")
            latest_action_date = latest_action.get("actionDate", "N/A")

            response_lines = [
                f"Bill Status: {bill_id} ({congress}th Congress)\n\n",
                f"Title: {title}\n\n",
                f"Sponsor: {sponsor_name}\n",
                f"Introduced: {bill_details.get('introducedDate', 'N/A')}\n\n",
                f"Latest Action ({latest_action_date}):\n",
                f"{latest_action_text}\n\n",
                "Recent Actions:\n",
            ]

            # Add recent actions
            actions = bill_status.get("actions", [])
            if actions:
                for i, action in enumerate(actions[:10], 1):  # Show last 10 actions
                    action_date = action.get("actionDate", "N/A")
                    action_text = action.get("text", "No description")
                    response_lines.append(f"{i}. {action_date}: {action_text}\n")
            else:
                response_lines.append("No actions recorded.\n")

            return [{"type": "text", "text": "".join(response_lines)}]

        except Exception as e:
            logger.exception("Error in get_bill_status_handler")
            return [{"type": "text", "text": f"Error retrieving bill status: {str(e)}"}]


# Export all tools
ALL_TOOLS = [SEARCH_BILLS_SCHEMA, GET_BILL_TEXT_SCHEMA, GET_BILL_STATUS_SCHEMA]

TOOL_HANDLERS = {
    "search_bills": search_bills_handler,
    "get_bill_text": get_bill_text_handler,
    "get_bill_status": get_bill_status_handler,
}
