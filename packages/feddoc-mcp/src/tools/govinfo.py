"""
GovInfo MCP tools.

Provides tools for searching government documents across GovInfo collections.
"""

import logging
from typing import Dict, Any, List

from ..clients.govinfo_api import GovInfoClient, APIError
from ..config import get_config


logger = logging.getLogger(__name__)


# Tool Schemas (MCP format)

LIST_COLLECTIONS_SCHEMA = {
    "name": "list_govinfo_collections",
    "description": """List all available GovInfo collections.

GovInfo.gov provides access to official publications from all three branches of the Federal Government.
This tool lists all 39+ available collections including Congressional Bills, Federal Register,
Code of Federal Regulations, Court Opinions, and more.

Use this tool to discover what types of government documents are available before searching.

Examples:
- "What collections are available on GovInfo?"
- "List all GovInfo document types"
- "Show me available government document collections"
""",
    "inputSchema": {
        "type": "object",
        "properties": {},
    },
}


SEARCH_COLLECTION_SCHEMA = {
    "name": "search_govinfo_collection",
    "description": """Search for documents in a specific GovInfo collection.

Search government documents by collection code and date range. Returns a list of matching
packages with metadata and download links.

Common collection codes:
- BILLS: Congressional Bills
- FR: Federal Register
- CFR: Code of Federal Regulations
- CREC: Congressional Record
- CHRG: Congressional Hearings
- PLAW: Public and Private Laws
- USCOURTS: U.S. Court Opinions
- BUDGET: Budget of the U.S. Government
- CPD: Compilation of Presidential Documents
- USCODE: United States Code

Examples:
- "Search Congressional Record for documents from January 2024"
- "Find all Congressional hearings from last month"
- "Search CFR collection for recent updates"
- "Get Public Laws from fiscal year 2024"
""",
    "inputSchema": {
        "type": "object",
        "properties": {
            "collection_code": {
                "type": "string",
                "description": "Collection code (e.g., 'BILLS', 'FR', 'CHRG'). Use list_govinfo_collections to see all codes.",
            },
            "start_date": {
                "type": "string",
                "description": "Start date in ISO format (YYYY-MM-DD). Default: 30 days ago",
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            },
            "end_date": {
                "type": "string",
                "description": "End date in ISO format (YYYY-MM-DD). Default: today",
                "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results (1-100). Default: 20",
                "minimum": 1,
                "maximum": 100,
                "default": 20,
            },
        },
        "required": ["collection_code"],
    },
}


GET_PACKAGE_SCHEMA = {
    "name": "get_govinfo_package",
    "description": """Get detailed information about a specific GovInfo package.

Retrieves complete metadata and download links for a specific government document package.
Each package represents a published document and includes title, summary, date, download formats, etc.

Package IDs follow the format: COLLECTION-identifier
Examples: BILLS-115hr1625enr, FR-2024-12345, CHRG-115shrg12345

Examples:
- "Get details for package BILLS-118hr1"
- "Show me package FR-2024-12345"
- "Retrieve Congressional hearing CHRG-118shrg52367"
""",
    "inputSchema": {
        "type": "object",
        "properties": {
            "package_id": {
                "type": "string",
                "description": "Package identifier (e.g., 'BILLS-118hr1', 'FR-2024-12345')",
            },
        },
        "required": ["package_id"],
    },
}


# Tool Handlers


async def list_collections_handler(arguments: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Handle list_govinfo_collections tool calls.

    Args:
        arguments: Tool arguments from MCP client

    Returns:
        List of content blocks for MCP response

    Raises:
        APIError: If API request fails
    """
    logger.info("list_govinfo_collections")

    # Get config and check for API key
    config = get_config()
    if not hasattr(config, "govinfo_api_key") or not config.govinfo_api_key:
        return [
            {
                "type": "text",
                "text": (
                    "Error: GOVINFO_API_KEY not configured.\n\n"
                    "To use GovInfo tools, you need a free API key from api.data.gov:\n"
                    "1. Visit https://api.data.gov/signup/\n"
                    "2. Sign up for a free API key\n"
                    "3. Add GOVINFO_API_KEY to your .env file or environment"
                ),
            }
        ]

    async with GovInfoClient(config.govinfo_api_key) as client:
        try:
            # List collections
            collections = await client.list_collections()

            # Format results
            if not collections:
                return [{"type": "text", "text": "No collections found."}]

            # Build response text
            response_lines = [
                f"Found {len(collections)} GovInfo collections:\n\n"
            ]

            # Sort by collection code
            sorted_collections = sorted(
                collections, key=lambda c: c.get("collectionCode", "")
            )

            for coll in sorted_collections:
                code = coll.get("collectionCode", "N/A")
                name = coll.get("collectionName", "No name")
                package_count = coll.get("packageCount", 0)
                granule_count = coll.get("granuleCount", 0)

                response_lines.append(
                    f"- {code}: {name}\n"
                    f"  Packages: {package_count:,}"
                )

                if granule_count > 0:
                    response_lines.append(f", Granules: {granule_count:,}")

                response_lines.append("\n")

            response_lines.append(
                "\nUse search_govinfo_collection with a collection code to search for documents.\n"
            )

            return [{"type": "text", "text": "".join(response_lines)}]

        except APIError as e:
            logger.error(f"API error: {e}")
            return [
                {
                    "type": "text",
                    "text": (
                        f"API Error: {str(e)}\n\n"
                        "Please check your internet connection and API key."
                    ),
                }
            ]

        except Exception as e:
            logger.exception("Unexpected error in list_collections_handler")
            return [{"type": "text", "text": f"Unexpected error: {str(e)}"}]


async def search_collection_handler(
    arguments: Dict[str, Any],
) -> List[Dict[str, str]]:
    """
    Handle search_govinfo_collection tool calls.

    Args:
        arguments: Tool arguments from MCP client

    Returns:
        List of content blocks for MCP response

    Raises:
        ValueError: If arguments are invalid
        APIError: If API request fails
    """
    # Extract arguments
    collection_code: str = arguments.get("collection_code", "")
    start_date: str | None = arguments.get("start_date")
    end_date: str | None = arguments.get("end_date")
    limit: int = arguments.get("limit", 20)

    log_msg = f"search_govinfo_collection: collection={collection_code}, limit={limit}"
    if start_date and end_date:
        log_msg += f", date_range={start_date} to {end_date}"
    logger.info(log_msg)

    # Get config and check for API key
    config = get_config()
    if not hasattr(config, "govinfo_api_key") or not config.govinfo_api_key:
        return [
            {
                "type": "text",
                "text": (
                    "Error: GOVINFO_API_KEY not configured.\n\n"
                    "To use GovInfo tools, you need a free API key from api.data.gov:\n"
                    "1. Visit https://api.data.gov/signup/\n"
                    "2. Sign up for a free API key\n"
                    "3. Add GOVINFO_API_KEY to your .env file or environment"
                ),
            }
        ]

    async with GovInfoClient(config.govinfo_api_key) as client:
        try:
            # Search collection
            packages = await client.search_collection(
                collection_code=collection_code,
                start_date=start_date,
                end_date=end_date,
                limit=limit,
            )

            # Format results
            if not packages:
                return [
                    {
                        "type": "text",
                        "text": f"No packages found in collection '{collection_code}'.",
                    }
                ]

            # Build response text
            response_lines = [
                f"Found {len(packages)} packages in collection '{collection_code}':\n\n"
            ]

            for i, pkg in enumerate(packages, 1):
                package_id = pkg.get("packageId", "N/A")
                title = pkg.get("title", "No title")
                date_issued = pkg.get("dateIssued", "N/A")
                package_link = pkg.get("packageLink", "")

                response_lines.append(
                    f"{i}. {title}\n"
                    f"   Package ID: {package_id}\n"
                    f"   Date Issued: {date_issued}\n"
                )

                if package_link:
                    response_lines.append(f"   Link: {package_link}\n")

                response_lines.append("\n")

            response_lines.append(
                "Use get_govinfo_package with a package ID to get full details and download links.\n"
            )

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
                        "Please check your internet connection and API key."
                    ),
                }
            ]

        except Exception as e:
            logger.exception("Unexpected error in search_collection_handler")
            return [{"type": "text", "text": f"Unexpected error: {str(e)}"}]


async def get_package_handler(arguments: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Handle get_govinfo_package tool calls.

    Args:
        arguments: Tool arguments from MCP client

    Returns:
        List of content blocks for MCP response
    """
    # Extract arguments
    package_id: str = arguments.get("package_id", "")

    logger.info(f"get_govinfo_package: {package_id}")

    # Get config and check for API key
    config = get_config()
    if not hasattr(config, "govinfo_api_key") or not config.govinfo_api_key:
        return [
            {
                "type": "text",
                "text": (
                    "Error: GOVINFO_API_KEY not configured.\n\n"
                    "To use GovInfo tools, you need a free API key from api.data.gov:\n"
                    "1. Visit https://api.data.gov/signup/\n"
                    "2. Sign up for a free API key\n"
                    "3. Add GOVINFO_API_KEY to your .env file or environment"
                ),
            }
        ]

    async with GovInfoClient(config.govinfo_api_key) as client:
        try:
            # Get package summary
            pkg = await client.get_package_summary(package_id)

            # Format response
            title = pkg.get("title", "No title")
            collection_code = pkg.get("collectionCode", "N/A")
            collection_name = pkg.get("collectionName", "N/A")
            date_issued = pkg.get("dateIssued", "N/A")
            package_link = pkg.get("packageLink", "")

            # Get download formats
            download = pkg.get("download", {})
            formats = []
            if download:
                if download.get("txtLink"):
                    formats.append(f"TXT: {download['txtLink']}")
                if download.get("pdfLink"):
                    formats.append(f"PDF: {download['pdfLink']}")
                if download.get("xmlLink"):
                    formats.append(f"XML: {download['xmlLink']}")
                if download.get("modsLink"):
                    formats.append(f"MODS: {download['modsLink']}")

            # Get pages/pages info
            pages = pkg.get("pages", "N/A")

            # Get government author if available
            gov_author = pkg.get("governmentAuthor1", "")
            gov_author2 = pkg.get("governmentAuthor2", "")

            response_lines = [
                f"GovInfo Package: {package_id}\n\n",
                f"Title: {title}\n\n",
                f"Collection: {collection_name} ({collection_code})\n",
                f"Date Issued: {date_issued}\n",
            ]

            if pages and pages != "N/A":
                response_lines.append(f"Pages: {pages}\n")

            if gov_author:
                response_lines.append(f"Government Author: {gov_author}\n")
                if gov_author2:
                    response_lines.append(f"                   {gov_author2}\n")

            if package_link:
                response_lines.append(f"\nPackage Link: {package_link}\n")

            if formats:
                response_lines.append("\nAvailable Formats:\n")
                for fmt in formats:
                    response_lines.append(f"- {fmt}\n")

            return [{"type": "text", "text": "".join(response_lines)}]

        except Exception as e:
            logger.exception("Error in get_package_handler")
            return [
                {
                    "type": "text",
                    "text": f"Error retrieving package details: {str(e)}",
                }
            ]


# Export all tools
ALL_TOOLS = [
    LIST_COLLECTIONS_SCHEMA,
    SEARCH_COLLECTION_SCHEMA,
    GET_PACKAGE_SCHEMA,
]

TOOL_HANDLERS = {
    "list_govinfo_collections": list_collections_handler,
    "search_govinfo_collection": search_collection_handler,
    "get_govinfo_package": get_package_handler,
}
