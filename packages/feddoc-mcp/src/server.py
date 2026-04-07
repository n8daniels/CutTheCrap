#!/usr/bin/env python3
"""
FedDocMCP - Model Context Protocol Server for Congressional Bill Data.

This server provides MCP tools for accessing Congress.gov API data through
Claude Desktop and other MCP clients.
"""

import sys
import logging
import asyncio
from typing import Any, cast, Dict

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
)

from .config import get_config, ConfigError
from .tools.bills import ALL_TOOLS as BILLS_TOOLS, TOOL_HANDLERS as BILLS_HANDLERS
from .tools.federal_register import (
    ALL_TOOLS as FED_REG_TOOLS,
    TOOL_HANDLERS as FED_REG_HANDLERS,
)
from .tools.govinfo import (
    ALL_TOOLS as GOVINFO_TOOLS,
    TOOL_HANDLERS as GOVINFO_HANDLERS,
)
from .tools.system import ALL_TOOLS as SYSTEM_TOOLS, TOOL_HANDLERS as SYSTEM_HANDLERS
from .monitoring import monitored_tool
from .utils.logging import setup_logging


logger = logging.getLogger(__name__)


# Combine all tools and handlers
ALL_TOOLS = BILLS_TOOLS + FED_REG_TOOLS + GOVINFO_TOOLS + SYSTEM_TOOLS
TOOL_HANDLERS = {
    **BILLS_HANDLERS,
    **FED_REG_HANDLERS,
    **GOVINFO_HANDLERS,
    **SYSTEM_HANDLERS,
}

# Wrap all tool handlers with monitoring (except health check to avoid recursion)
for tool_name, handler in list(TOOL_HANDLERS.items()):
    if tool_name != "get_server_health":  # Don't monitor the health check itself
        TOOL_HANDLERS[tool_name] = monitored_tool(handler)


class FedDocMCPServer:
    """
    FedDocMCP Server implementation.

    Handles MCP protocol communication and routes tool calls to appropriate handlers.
    """

    def __init__(self) -> None:
        """Initialize the MCP server."""
        # Load configuration
        try:
            self.config = get_config()
            logger.info("Configuration loaded successfully")
        except ConfigError as e:
            logger.error(f"Configuration error: {e}")
            sys.exit(1)

        # Create MCP server instance
        self.server = Server("feddocmcp")
        logger.info("FedDocMCP server initialized")

        # Register handlers
        self._register_handlers()

    def _register_handlers(self) -> None:
        """Register MCP protocol handlers."""

        @self.server.list_tools()
        async def list_tools() -> list[Tool]:
            """
            List available tools.

            Returns:
                List of tool definitions
            """
            logger.debug("list_tools called")

            tools = []
            for tool_schema in ALL_TOOLS:
                tools.append(
                    Tool(
                        name=cast(str, tool_schema["name"]),
                        description=cast(str, tool_schema["description"]),
                        inputSchema=cast(Dict[str, Any], tool_schema["inputSchema"]),
                    )
                )

            logger.info(f"Returning {len(tools)} tools")
            return tools

        @self.server.call_tool()
        async def call_tool(
            name: str, arguments: Any
        ) -> list[TextContent | ImageContent | EmbeddedResource]:
            """
            Handle tool execution requests.

            Args:
                name: Tool name
                arguments: Tool arguments

            Returns:
                List of content blocks
            """
            logger.info(f"Tool called: {name}")
            logger.debug(f"Arguments: {arguments}")

            # Check if tool exists
            if name not in TOOL_HANDLERS:
                logger.error(f"Unknown tool: {name}")
                return [TextContent(type="text", text=f"Error: Unknown tool '{name}'")]

            # Get handler
            handler = TOOL_HANDLERS[name]

            try:
                # Call handler
                result = await handler(arguments)

                # Convert to MCP content types
                content: list[TextContent | ImageContent | EmbeddedResource] = []
                for item in result:
                    if item["type"] == "text":
                        content.append(TextContent(type="text", text=item["text"]))
                    # Add support for other content types as needed

                logger.info(f"Tool {name} completed successfully")
                return content

            except Exception as e:
                logger.exception(f"Error executing tool {name}")
                return [
                    TextContent(type="text", text=f"Error executing {name}: {str(e)}")
                ]

    async def run(self) -> None:
        """
        Run the MCP server.

        Starts the server with stdio transport and handles shutdown.
        """
        logger.info("Starting FedDocMCP server...")

        try:
            # Run server with stdio transport
            async with stdio_server() as (read_stream, write_stream):
                logger.info("Server running with stdio transport")
                await self.server.run(
                    read_stream,
                    write_stream,
                    self.server.create_initialization_options(),
                )

        except KeyboardInterrupt:
            logger.info("Server interrupted by user")

        except Exception:
            logger.exception("Server error")
            raise

        finally:
            logger.info("Server shutdown complete")


async def main() -> None:
    """Run the main server entry point."""
    # Configure structured logging
    import os

    log_level = os.getenv("LOG_LEVEL", "INFO")
    use_json = os.getenv("LOG_FORMAT", "json").lower() == "json"
    log_file = os.getenv("LOG_FILE")  # Optional log file path

    setup_logging(level=log_level, use_json=use_json, log_file=log_file)
    logger.info(
        "Logging configured",
        extra={"level": log_level, "format": "json" if use_json else "text"},
    )

    # Create and run server
    server = FedDocMCPServer()
    await server.run()


def cli_main() -> None:
    """CLI entry point (for setuptools console_scripts)."""
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(0)
    except Exception:
        logger.exception("Fatal error")
        sys.exit(1)


if __name__ == "__main__":
    cli_main()
