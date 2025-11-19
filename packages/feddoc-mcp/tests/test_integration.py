"""
Integration tests for FedDocMCP.

These tests verify the full flow from tool call to response,
using mocked API responses.
"""

import pytest
from unittest.mock import patch
from src.server import FedDocMCPServer
from src.tools.bills import TOOL_HANDLERS
from .test_bills import create_async_context_manager_mock


@pytest.mark.integration
class TestEndToEndFlow:
    """Test complete end-to-end flows."""

    @pytest.fixture
    def mock_env(self, monkeypatch):
        """Set up environment for integration tests."""
        monkeypatch.setenv("CONGRESS_API_KEY", "test_integration_key")
        monkeypatch.setenv("LOG_LEVEL", "ERROR")
        return monkeypatch

    @pytest.fixture
    def server(self, mock_env):
        """Create server instance for testing."""
        return FedDocMCPServer()

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_search_bills_end_to_end(self, mock_client_class, server):
        """Test complete search_bills flow."""
        # Mock API client responses
        mock_client = create_async_context_manager_mock()
        mock_client.search_bills.return_value = [
            {
                "type": "hr",
                "number": 1234,
                "title": "Integration Test Bill",
                "congress": 118,
                "introducedDate": "2023-01-15",
                "sponsor": {"name": "Rep. Test"},
            },
            {
                "type": "s",
                "number": 567,
                "title": "Another Test Bill",
                "congress": 118,
                "introducedDate": "2023-01-20",
                "sponsor": {"name": "Sen. Example"},
            },
        ]
        mock_client_class.return_value = mock_client

        # Call search_bills handler
        result = await TOOL_HANDLERS["search_bills"](
            {"query": "climate change", "limit": 10}
        )

        # Verify response structure
        assert len(result) == 1
        assert result[0]["type"] == "text"

        # Verify content
        text = result[0]["text"]
        assert "Found 2 bills" in text
        assert "Integration Test Bill" in text
        assert "H.R. 1234" in text
        assert "S. 567" in text
        assert "118th Congress" in text

        # Verify API was called correctly
        mock_client.search_bills.assert_called_once_with(
            query="climate change",
            congress=None,
            bill_type=None,
            limit=10,
            fiscal_year=None,
            start_date=None,
            end_date=None,
        )

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_get_bill_details_end_to_end(self, mock_client_class, server):
        """Test complete get_bill_status flow."""
        # Mock API responses
        mock_client = create_async_context_manager_mock()
        mock_client.get_bill_details.return_value = {
            "title": "Infrastructure Investment and Jobs Act",
            "sponsor": {"name": "Rep. Infrastructure"},
            "introducedDate": "2021-06-04",
            "latestAction": {
                "actionDate": "2021-11-15",
                "text": "Became Public Law No: 117-58.",
            },
        }
        mock_client.get_bill_status.return_value = {
            "actions": [
                {"actionDate": "2021-11-15", "text": "Became Public Law No: 117-58."},
                {"actionDate": "2021-11-05", "text": "Passed House"},
                {"actionDate": "2021-08-10", "text": "Passed Senate"},
            ]
        }
        mock_client_class.return_value = mock_client

        # Call handler
        result = await TOOL_HANDLERS["get_bill_status"](
            {"congress": 117, "bill_type": "hr", "bill_number": 3684}
        )

        # Verify response
        assert len(result) == 1
        text = result[0]["text"]
        assert "Infrastructure Investment and Jobs Act" in text
        assert "Rep. Infrastructure" in text
        assert "Became Public Law" in text
        assert "Passed House" in text
        assert "Passed Senate" in text

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_error_handling_end_to_end(self, mock_client_class, server):
        """Test error handling in end-to-end flow."""
        from src.clients.congress_api import APIError

        # Mock API error
        mock_client = create_async_context_manager_mock()
        mock_client.search_bills.side_effect = APIError("Connection failed")
        mock_client_class.return_value = mock_client

        # Call handler
        result = await TOOL_HANDLERS["search_bills"]({"query": "test", "limit": 5})

        # Verify error is handled gracefully
        assert len(result) == 1
        assert "API Error" in result[0]["text"]
        assert "Connection failed" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_search_with_filters(self, mock_client_class, server):
        """Test search with congress and bill type filters."""
        mock_client = create_async_context_manager_mock()
        mock_client.search_bills.return_value = [
            {
                "type": "hr",
                "number": 100,
                "title": "House Bill from 117th Congress",
                "congress": 117,
                "introducedDate": "2021-01-01",
            }
        ]
        mock_client_class.return_value = mock_client

        # Call with filters
        result = await TOOL_HANDLERS["search_bills"](
            {"query": "infrastructure", "congress": 117, "bill_type": "hr", "limit": 20}
        )

        # Verify filters were passed
        mock_client.search_bills.assert_called_once_with(
            query="infrastructure",
            congress=117,
            bill_type="hr",
            limit=20,
            fiscal_year=None,
            start_date=None,
            end_date=None,
        )

        # Verify response
        assert "House Bill from 117th Congress" in result[0]["text"]

    @pytest.mark.asyncio
    async def test_server_initialization(self, server):
        """Test server initializes correctly."""
        assert server.server is not None
        assert server.config is not None
        assert server.config.congress_api_key == "test_integration_key"

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_empty_search_results(self, mock_client_class, server):
        """Test handling of empty search results."""
        mock_client = create_async_context_manager_mock()
        mock_client.search_bills.return_value = []
        mock_client_class.return_value = mock_client

        result = await TOOL_HANDLERS["search_bills"](
            {"query": "veryspecificquerywithnoResults123456789"}
        )

        assert "No bills found" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_multiple_tool_calls(self, mock_client_class, server):
        """Test multiple sequential tool calls."""
        mock_client = create_async_context_manager_mock()

        # First call: search
        mock_client.search_bills.return_value = [
            {
                "type": "hr",
                "number": 1,
                "title": "First Bill",
                "congress": 118,
                "introducedDate": "2023-01-01",
            }
        ]

        # Second call: get details
        mock_client.get_bill_details.return_value = {
            "title": "First Bill",
            "sponsor": {"name": "Rep. First"},
            "introducedDate": "2023-01-01",
            "latestAction": {"text": "Introduced", "actionDate": "2023-01-01"},
        }
        mock_client.get_bill_status.return_value = {
            "actions": [{"text": "Introduced", "actionDate": "2023-01-01"}]
        }

        mock_client_class.return_value = mock_client

        # First tool call
        result1 = await TOOL_HANDLERS["search_bills"]({"query": "test"})
        assert "First Bill" in result1[0]["text"]

        # Second tool call
        result2 = await TOOL_HANDLERS["get_bill_status"](
            {"congress": 118, "bill_type": "hr", "bill_number": 1}
        )
        assert "First Bill" in result2[0]["text"]
        assert "Rep. First" in result2[0]["text"]


@pytest.mark.integration
class TestConfigurationIntegration:
    """Test configuration integration."""

    def test_config_loads_from_env(self, monkeypatch):
        """Test that configuration loads correctly from environment."""
        monkeypatch.setenv("CONGRESS_API_KEY", "test_config_key")
        monkeypatch.setenv("LOG_LEVEL", "DEBUG")
        monkeypatch.setenv("CONGRESS_API_RATE_LIMIT", "1000")

        # Reset config
        import src.config

        src.config._config = None

        from src.config import get_config

        config = get_config()

        assert config.congress_api_key == "test_config_key"
        assert config.log_level == "DEBUG"
        assert config.rate_limit == 1000
