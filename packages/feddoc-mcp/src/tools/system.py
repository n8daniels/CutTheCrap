"""
System and monitoring MCP tools.

Provides tools for checking server health, performance metrics, and status.
"""

import logging
from typing import Dict, Any, List

from ..monitoring import get_monitor


logger = logging.getLogger(__name__)


# Tool Schemas (MCP format)

GET_SERVER_HEALTH_SCHEMA = {
    "name": "get_server_health",
    "description": """Get FedDocMCP server health and performance metrics.

Returns comprehensive metrics including:
- Overall health status
- Cache hit rate and efficiency
- Average response time
- API call statistics
- Tool usage statistics
- Error rates

Use this to monitor server performance and diagnose issues.

Examples:
- "Check server health"
- "Show me performance metrics"
- "How is the cache performing?"
""",
    "inputSchema": {
        "type": "object",
        "properties": {},  # No parameters required
    },
}


# Tool Handlers


async def get_server_health_handler(arguments: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Handle get_server_health tool calls.

    Args:
        arguments: Tool arguments from MCP client (none required)

    Returns:
        List of content blocks for MCP response
    """
    logger.info("get_server_health called")

    try:
        monitor = get_monitor()
        health = monitor.get_health_report()

        # Format the health report as readable text
        response_lines = [
            "# FedDocMCP Server Health Report\n\n",
            f"**Status:** {health['status']}\n",
            f"**Uptime:** {health['uptime_info']}\n\n",
            "## Cache Performance\n",
            f"- Hit Rate: {health['cache']['hit_rate']}\n",
            f"- Hits: {health['cache']['hits']:,}\n",
            f"- Misses: {health['cache']['misses']:,}\n",
            f"- Total Operations: {health['cache']['total_operations']:,}\n\n",
            "## Performance\n",
            f"- Average Response Time: {health['performance']['avg_response_time_ms']:.2f}ms\n",
            f"- Total Requests: {health['performance']['total_requests']:,}\n",
            f"- Samples Tracked: {health['performance']['samples_tracked']:,}\n\n",
            "## API Calls\n",
            f"- Total API Calls: {health['api_calls']['total']:,}\n",
        ]

        if health["api_calls"]["by_api"]:
            response_lines.append("- By API:\n")
            for api_name, count in health["api_calls"]["by_api"].items():
                response_lines.append(f"  - {api_name}: {count:,}\n")
        else:
            response_lines.append("- By API: (no calls yet)\n")

        response_lines.append("\n## Tool Usage\n")
        response_lines.append(
            f"- Total Tool Calls: {health['tools']['total_calls']:,}\n"
        )

        if health["tools"]["by_tool"]:
            response_lines.append("- By Tool:\n")
            for tool_name, count in health["tools"]["by_tool"].items():
                response_lines.append(f"  - {tool_name}: {count:,}\n")
        else:
            response_lines.append("- By Tool: (no calls yet)\n")

        response_lines.append("\n## Errors\n")
        response_lines.append(f"- Error Count: {health['errors']['count']:,}\n")
        response_lines.append(f"- Error Rate: {health['errors']['rate']}\n")

        # Add interpretation guidance
        response_lines.append("\n## Health Indicators\n")
        response_lines.append("- ✅ Good cache hit rate: >70%\n")
        response_lines.append("- ✅ Good response time: <100ms avg\n")
        response_lines.append("- ✅ Low error rate: <1%\n")

        return [{"type": "text", "text": "".join(response_lines)}]

    except Exception as e:
        logger.exception("Error in get_server_health_handler")
        return [
            {
                "type": "text",
                "text": f"Error retrieving server health: {str(e)}",
            }
        ]


# Export all tools
ALL_TOOLS = [GET_SERVER_HEALTH_SCHEMA]

TOOL_HANDLERS = {
    "get_server_health": get_server_health_handler,
}
