"""
Federal Register MCP tools.

Provides tools for searching regulations, rules, and Federal Register documents.
"""

import logging
from typing import Dict, Any, List

from ..clients.federal_register_api import FederalRegisterClient, APIError


logger = logging.getLogger(__name__)


# Tool Schemas (MCP format)

SEARCH_REGULATIONS_SCHEMA = {
    "name": "search_regulations",
    "description": """Search the Federal Register for regulations, rules, notices, and presidential documents.

Use this tool to find federal regulations, proposed rules, notices, and other documents
published in the Federal Register. Returns detailed information about matching documents.
Supports date filtering via fiscal year or explicit date ranges.

Examples:
- "Search for environmental protection regulations"
- "Find proposed rules about data privacy"
- "Search for presidential documents in fiscal year 2024"
- "Find EPA notices from January to June 2023"
""",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search keywords or phrases (required)",
            },
            "document_type": {
                "type": "string",
                "enum": ["rule", "prorule", "notice", "presdocu"],
                "description": """Type of document. Optional. Options:
- rule: Final Rule
- prorule: Proposed Rule
- notice: Notice
- presdocu: Presidential Document""",
            },
            "agency": {
                "type": "string",
                "description": "Filter by agency name or identifier (e.g., 'EPA', 'FDA'). Optional.",
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
                    "Federal fiscal year (e.g., 2024). Filters to documents "
                    "from Oct 1 - Sep 30. Cannot be used with "
                    "start_date/end_date."
                ),
                "minimum": 1936,  # Federal Register started in 1936
            },
            "start_date": {
                "type": "string",
                "description": (
                    "Start date for filtering documents (ISO format: "
                    "YYYY-MM-DD). Requires end_date. Cannot be used with "
                    "fiscal_year."
                ),
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            },
            "end_date": {
                "type": "string",
                "description": (
                    "End date for filtering documents (ISO format: "
                    "YYYY-MM-DD). Requires start_date. Cannot be used with "
                    "fiscal_year. Max 10-year range."
                ),
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            },
        },
        "required": ["query"],
    },
}


GET_REGULATION_DETAILS_SCHEMA = {
    "name": "get_regulation_details",
    "description": """Get detailed information about a specific Federal Register document.

Retrieves the complete details of a Federal Register document including full text,
metadata, agencies involved, dates, and document identifiers.

Examples:
- "Get details for Federal Register document 2024-12345"
- "Show me the full details of document FR-2023-09876"
- "Retrieve Federal Register document 2024-00001"
""",
    "inputSchema": {
        "type": "object",
        "properties": {
            "document_number": {
                "type": "string",
                "description": "Federal Register document number (e.g., '2024-12345')",
            },
        },
        "required": ["document_number"],
    },
}


GET_PUBLIC_INSPECTION_SCHEMA = {
    "name": "get_public_inspection_documents",
    "description": """Get documents currently on public inspection (filed but not yet published).

Retrieves documents that have been filed with the Federal Register but not yet
published. These are often time-sensitive regulatory actions.

Examples:
- "Show me documents on public inspection"
- "Get EPA documents on public inspection"
- "Find special filing documents awaiting publication"
""",
    "inputSchema": {
        "type": "object",
        "properties": {
            "agency": {
                "type": "string",
                "description": "Filter by agency name or identifier (e.g., 'EPA'). Optional.",
            },
            "special_filing": {
                "type": "boolean",
                "description": "Show only special filings (default: false). Optional.",
                "default": False,
            },
        },
    },
}


# Tool Handlers


async def search_regulations_handler(arguments: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Handle search_regulations tool calls.

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
    document_type: str | None = arguments.get("document_type")
    agency: str | None = arguments.get("agency")
    limit: int = arguments.get("limit", 20)
    fiscal_year: int | None = arguments.get("fiscal_year")
    start_date: str | None = arguments.get("start_date")
    end_date: str | None = arguments.get("end_date")

    log_msg = f"search_regulations: query='{query}', type={document_type}, agency={agency}, limit={limit}"
    if fiscal_year:
        log_msg += f", fiscal_year={fiscal_year}"
    if start_date and end_date:
        log_msg += f", date_range={start_date} to {end_date}"
    logger.info(log_msg)

    # Use async context manager for automatic cleanup
    async with FederalRegisterClient() as client:
        try:
            # Search documents
            documents = await client.search_documents(
                query=query,
                document_type=document_type,
                agency=agency,
                limit=limit,
                fiscal_year=fiscal_year,
                start_date=start_date,
                end_date=end_date,
            )

            # Format results
            if not documents:
                return [
                    {"type": "text", "text": f"No documents found matching '{query}'."}
                ]

            # Build response text
            response_lines = [
                f"Found {len(documents)} Federal Register documents matching '{query}':\n"
            ]

            for i, doc in enumerate(documents, 1):
                doc_type = doc.get("type", "N/A")
                title = doc.get("title", "No title")
                pub_date = doc.get("publication_date", "N/A")
                doc_number = doc.get("document_number", "N/A")
                agencies = doc.get("agencies", [])
                agency_names = (
                    ", ".join([a.get("name", "") for a in agencies])
                    if agencies
                    else "N/A"
                )

                # Get abstract or first 200 chars
                abstract = doc.get("abstract", "")
                if abstract and len(abstract) > 200:
                    abstract = abstract[:200] + "..."

                html_url = doc.get("html_url", "")
                pdf_url = doc.get("pdf_url", "")

                response_lines.append(
                    f"\n{i}. {title}\n"
                    f"   Type: {doc_type}\n"
                    f"   Document #: {doc_number}\n"
                    f"   Published: {pub_date}\n"
                    f"   Agencies: {agency_names}\n"
                )

                if abstract:
                    response_lines.append(f"   Abstract: {abstract}\n")

                if html_url:
                    response_lines.append(f"   HTML: {html_url}\n")
                if pdf_url:
                    response_lines.append(f"   PDF: {pdf_url}\n")

            return [{"type": "text", "text": "".join(response_lines)}]

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
                        "Please check your internet connection."
                    ),
                }
            ]

        except Exception as e:
            logger.exception("Unexpected error in search_regulations_handler")
            return [{"type": "text", "text": f"Unexpected error: {str(e)}"}]


async def get_regulation_details_handler(
    arguments: Dict[str, Any],
) -> List[Dict[str, str]]:
    """
    Handle get_regulation_details tool calls.

    Args:
        arguments: Tool arguments from MCP client

    Returns:
        List of content blocks for MCP response
    """
    # Extract arguments with type checks
    document_number: str = arguments.get("document_number", "")

    logger.info(f"get_regulation_details: {document_number}")

    async with FederalRegisterClient() as client:
        try:
            # Get document details
            doc = await client.get_document_details(document_number)

            # Format response
            title = doc.get("title", "No title")
            doc_type = doc.get("type", "N/A")
            pub_date = doc.get("publication_date", "N/A")
            agencies = doc.get("agencies", [])
            agency_names = (
                ", ".join([a.get("name", "") for a in agencies]) if agencies else "N/A"
            )

            abstract = doc.get("abstract", "No abstract available")
            full_text = doc.get("full_text_xml_url", "")
            html_url = doc.get("html_url", "")
            pdf_url = doc.get("pdf_url", "")

            citation = doc.get("citation", "")
            cfr_references = doc.get("cfr_references", [])

            response_lines = [
                f"Federal Register Document: {document_number}\n\n",
                f"Title: {title}\n\n",
                f"Type: {doc_type}\n",
                f"Published: {pub_date}\n",
                f"Agencies: {agency_names}\n",
            ]

            if citation:
                response_lines.append(f"Citation: {citation}\n")

            response_lines.append(f"\nAbstract:\n{abstract}\n\n")

            if cfr_references:
                response_lines.append("CFR References:\n")
                for ref in cfr_references[:5]:  # Show first 5
                    response_lines.append(
                        f"- {ref.get('title', '')} CFR {ref.get('part', '')}\n"
                    )
                response_lines.append("\n")

            response_lines.append("Available Formats:\n")
            if html_url:
                response_lines.append(f"- HTML: {html_url}\n")
            if pdf_url:
                response_lines.append(f"- PDF: {pdf_url}\n")
            if full_text:
                response_lines.append(f"- Full Text XML: {full_text}\n")

            return [{"type": "text", "text": "".join(response_lines)}]

        except Exception as e:
            logger.exception("Error in get_regulation_details_handler")
            return [
                {
                    "type": "text",
                    "text": f"Error retrieving regulation details: {str(e)}",
                }
            ]


async def get_public_inspection_handler(
    arguments: Dict[str, Any],
) -> List[Dict[str, str]]:
    """
    Handle get_public_inspection_documents tool calls.

    Args:
        arguments: Tool arguments from MCP client

    Returns:
        List of content blocks for MCP response
    """
    # Extract arguments with type checks
    agency: str | None = arguments.get("agency")
    special_filing: bool = arguments.get("special_filing", False)

    logger.info(
        f"get_public_inspection_documents: agency={agency}, special_filing={special_filing}"
    )

    async with FederalRegisterClient() as client:
        try:
            # Get public inspection documents
            documents = await client.get_public_inspection_documents(
                agency=agency, special_filing=special_filing
            )

            # Format results
            if not documents:
                msg = "No documents currently on public inspection"
                if agency:
                    msg += f" for {agency}"
                return [{"type": "text", "text": f"{msg}."}]

            # Build response text
            response_lines = ["Documents on Public Inspection:\n"]
            if agency:
                response_lines[0] = f"Documents on Public Inspection for {agency}:\n"

            for i, doc in enumerate(documents, 1):
                title = doc.get("title", "No title")
                doc_type = doc.get("type", "N/A")
                doc_number = doc.get("document_number", "N/A")
                filing_date = doc.get("filing_date", "N/A")
                agencies = doc.get("agencies", [])
                agency_names = (
                    ", ".join([a.get("name", "") for a in agencies])
                    if agencies
                    else "N/A"
                )
                pdf_url = doc.get("pdf_url", "")

                response_lines.append(
                    f"\n{i}. {title}\n"
                    f"   Type: {doc_type}\n"
                    f"   Document #: {doc_number}\n"
                    f"   Filed: {filing_date}\n"
                    f"   Agencies: {agency_names}\n"
                )

                if pdf_url:
                    response_lines.append(f"   PDF: {pdf_url}\n")

            return [{"type": "text", "text": "".join(response_lines)}]

        except Exception as e:
            logger.exception("Error in get_public_inspection_handler")
            return [
                {
                    "type": "text",
                    "text": f"Error retrieving public inspection documents: {str(e)}",
                }
            ]


# Export all tools
ALL_TOOLS = [
    SEARCH_REGULATIONS_SCHEMA,
    GET_REGULATION_DETAILS_SCHEMA,
    GET_PUBLIC_INSPECTION_SCHEMA,
]

TOOL_HANDLERS = {
    "search_regulations": search_regulations_handler,
    "get_regulation_details": get_regulation_details_handler,
    "get_public_inspection_documents": get_public_inspection_handler,
}
