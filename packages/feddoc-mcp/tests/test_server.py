"""Tests for MCP server."""

import pytest
from src.server import FedDocMCPServer


class TestFedDocMCPServer:
    """Test FedDocMCPServer class."""

    @pytest.fixture
    def mock_config(self, monkeypatch):
        """Mock configuration for testing."""
        monkeypatch.setenv("CONGRESS_API_KEY", "test_api_key")
        from src.config import get_config

        return get_config(reload=True)

    def test_server_initialization(self, mock_config):
        """Test server initializes correctly."""
        server = FedDocMCPServer()

        assert server.config is not None
        assert server.server is not None

    def test_server_initialization_without_api_key(self, monkeypatch):
        """Test server fails to initialize without API key."""
        monkeypatch.delenv("CONGRESS_API_KEY", raising=False)

        # Mock dotenv to prevent loading from .env file
        monkeypatch.setattr("src.config.load_dotenv", lambda: None)

        # Reset config
        import src.config

        src.config._config = None

        with pytest.raises(SystemExit):
            FedDocMCPServer()

    @pytest.mark.asyncio
    async def test_list_tools(self, mock_config):
        """Test list_tools handler."""
        # Get the list_tools handler
        # Note: This is a simplified test since we can't easily call the decorated function directly
        # In real MCP usage, the server would handle this

        from src.tools.bills import ALL_TOOLS

        assert len(ALL_TOOLS) == 3

    @pytest.mark.asyncio
    async def test_call_tool_unknown(self, mock_config):
        """Test calling unknown tool."""
        # This test verifies the tool routing logic
        from src.tools.bills import TOOL_HANDLERS

        assert "unknown_tool" not in TOOL_HANDLERS

    @pytest.mark.asyncio
    async def test_call_tool_search_bills(self, mock_config):
        """Test calling search_bills tool."""
        from src.tools.bills import TOOL_HANDLERS

        assert "search_bills" in TOOL_HANDLERS
        handler = TOOL_HANDLERS["search_bills"]
        assert callable(handler)

    def test_server_name(self, mock_config):
        """Test server has correct name."""
        server = FedDocMCPServer()
        assert server.server.name == "feddocmcp"
