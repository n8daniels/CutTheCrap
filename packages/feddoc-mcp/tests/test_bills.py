"""Tests for bill tools."""

import pytest
from unittest.mock import patch, AsyncMock
from src.tools.bills import (
    search_bills_handler,
    get_bill_text_handler,
    get_bill_status_handler,
    ALL_TOOLS,
    TOOL_HANDLERS,
)


def create_async_context_manager_mock():
    """Create a mock that works as an async context manager."""
    mock_client = AsyncMock()

    async def aenter(*args, **kwargs):
        return mock_client

    async def aexit(*args, **kwargs):
        pass

    mock_client.__aenter__ = AsyncMock(side_effect=aenter)
    mock_client.__aexit__ = AsyncMock(side_effect=aexit)

    return mock_client


class TestToolSchemas:
    """Test tool schema definitions."""

    def test_all_tools_defined(self):
        """Test that all tools are defined."""
        assert len(ALL_TOOLS) == 3

        tool_names = [tool["name"] for tool in ALL_TOOLS]
        assert "search_bills" in tool_names
        assert "get_bill_text" in tool_names
        assert "get_bill_status" in tool_names

    def test_tool_handlers_defined(self):
        """Test that all tool handlers are defined."""
        assert len(TOOL_HANDLERS) == 3

        assert "search_bills" in TOOL_HANDLERS
        assert "get_bill_text" in TOOL_HANDLERS
        assert "get_bill_status" in TOOL_HANDLERS

    def test_search_bills_schema(self):
        """Test search_bills schema structure."""
        schema = next(t for t in ALL_TOOLS if t["name"] == "search_bills")

        assert "name" in schema
        assert "description" in schema
        assert "inputSchema" in schema

        input_schema = schema["inputSchema"]
        assert input_schema["type"] == "object"
        assert "properties" in input_schema
        assert "required" in input_schema

        # Check required field
        assert "query" in input_schema["required"]

        # Check properties
        props = input_schema["properties"]
        assert "query" in props
        assert "congress" in props
        assert "bill_type" in props
        assert "limit" in props


class TestSearchBillsHandler:
    """Test search_bills tool handler."""

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_search_bills_success(self, mock_client_class):
        """Test successful bill search."""
        # Mock API client with async context manager support
        mock_client = create_async_context_manager_mock()
        mock_client.search_bills.return_value = [
            {
                "type": "hr",
                "number": 1,
                "title": "Test Bill",
                "congress": 118,
                "introducedDate": "2023-01-01",
            }
        ]
        mock_client_class.return_value = mock_client

        # Call handler
        result = await search_bills_handler({"query": "test", "limit": 10})

        # Check result
        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Test Bill" in result[0]["text"]
        assert "H.R. 1" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_search_bills_no_results(self, mock_client_class):
        """Test bill search with no results."""
        mock_client = create_async_context_manager_mock()
        mock_client.search_bills.return_value = []
        mock_client_class.return_value = mock_client

        result = await search_bills_handler({"query": "nonexistent"})

        assert len(result) == 1
        assert "No bills found" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_search_bills_validation_error(self, mock_client_class):
        """Test bill search with validation error."""
        mock_client = create_async_context_manager_mock()
        mock_client.search_bills.side_effect = ValueError("Invalid limit")
        mock_client_class.return_value = mock_client

        result = await search_bills_handler({"query": "test", "limit": 1000})  # Invalid

        assert len(result) == 1
        assert "Error" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_search_bills_api_error(self, mock_client_class):
        """Test bill search with API error."""
        from src.clients.congress_api import APIError

        mock_client = create_async_context_manager_mock()
        mock_client.search_bills.side_effect = APIError("API connection failed")
        mock_client_class.return_value = mock_client

        result = await search_bills_handler({"query": "test"})

        assert len(result) == 1
        assert "API Error" in result[0]["text"]


class TestGetBillTextHandler:
    """Test get_bill_text tool handler."""

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_get_bill_text_success(self, mock_client_class):
        """Test successful bill text retrieval."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_bill_details.return_value = {"title": "Test Bill Title"}
        mock_client.get_bill_text.return_value = {
            "textVersions": [
                {
                    "type": "Introduced",
                    "date": "2023-01-01",
                    "formats": [{"type": "PDF", "url": "http://example.com/bill.pdf"}],
                }
            ]
        }
        mock_client_class.return_value = mock_client

        result = await get_bill_text_handler(
            {"congress": 118, "bill_type": "hr", "bill_number": 1}
        )

        assert len(result) == 1
        assert "Test Bill Title" in result[0]["text"]
        assert "H.R. 1" in result[0]["text"]


class TestGetBillStatusHandler:
    """Test get_bill_status tool handler."""

    @pytest.mark.asyncio
    @patch("src.tools.bills.CongressAPIClient")
    async def test_get_bill_status_success(self, mock_client_class):
        """Test successful bill status retrieval."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_bill_details.return_value = {
            "title": "Test Bill",
            "sponsor": {"name": "Rep. Test"},
            "introducedDate": "2023-01-01",
            "latestAction": {
                "text": "Referred to committee",
                "actionDate": "2023-01-02",
            },
        }
        mock_client.get_bill_status.return_value = {
            "actions": [{"actionDate": "2023-01-02", "text": "Referred to committee"}]
        }
        mock_client_class.return_value = mock_client

        result = await get_bill_status_handler(
            {"congress": 118, "bill_type": "hr", "bill_number": 1}
        )

        assert len(result) == 1
        assert "Test Bill" in result[0]["text"]
        assert "Rep. Test" in result[0]["text"]
        assert "Referred to committee" in result[0]["text"]
