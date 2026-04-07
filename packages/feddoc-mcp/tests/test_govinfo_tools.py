"""Tests for GovInfo MCP tools."""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.tools.govinfo import (
    list_collections_handler,
    search_collection_handler,
    get_package_handler,
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


class TestListCollectionsHandler:
    """Test list_govinfo_collections handler."""

    @pytest.mark.asyncio
    @patch("src.tools.govinfo.GovInfoClient")
    @patch("src.tools.govinfo.get_config")
    async def test_list_collections_success(self, mock_config, mock_client_class):
        """Test successful collection listing."""
        # Mock config
        config = Mock()
        config.govinfo_api_key = "test-key"
        mock_config.return_value = config

        # Mock client
        mock_client = create_async_context_manager_mock()
        mock_client.list_collections.return_value = [
            {
                "collectionCode": "BILLS",
                "collectionName": "Congressional Bills",
                "packageCount": 1000,
                "granuleCount": 0,
            },
            {
                "collectionCode": "FR",
                "collectionName": "Federal Register",
                "packageCount": 5000,
                "granuleCount": 10000,
            },
        ]
        mock_client_class.return_value = mock_client

        result = await list_collections_handler({})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Found 2 GovInfo collections" in result[0]["text"]
        assert "BILLS: Congressional Bills" in result[0]["text"]
        assert "FR: Federal Register" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.govinfo.get_config")
    async def test_list_collections_no_api_key(self, mock_config):
        """Test listing without API key."""
        # Mock config without API key
        config = Mock()
        config.govinfo_api_key = None
        mock_config.return_value = config

        result = await list_collections_handler({})

        assert len(result) == 1
        assert "Error: GOVINFO_API_KEY not configured" in result[0]["text"]


class TestSearchCollectionHandler:
    """Test search_govinfo_collection handler."""

    @pytest.mark.asyncio
    @patch("src.tools.govinfo.GovInfoClient")
    @patch("src.tools.govinfo.get_config")
    async def test_search_collection_success(self, mock_config, mock_client_class):
        """Test successful collection search."""
        # Mock config
        config = Mock()
        config.govinfo_api_key = "test-key"
        mock_config.return_value = config

        # Mock client
        mock_client = create_async_context_manager_mock()
        mock_client.search_collection.return_value = [
            {
                "packageId": "BILLS-118hr1",
                "title": "Test Bill",
                "dateIssued": "2024-01-01",
                "packageLink": "https://example.com",
            }
        ]
        mock_client_class.return_value = mock_client

        result = await search_collection_handler(
            {
                "collection_code": "BILLS",
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "limit": 20,
            }
        )

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Found 1 packages in collection 'BILLS'" in result[0]["text"]
        assert "BILLS-118hr1" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.govinfo.get_config")
    async def test_search_collection_no_api_key(self, mock_config):
        """Test search without API key."""
        # Mock config without API key
        config = Mock()
        config.govinfo_api_key = None
        mock_config.return_value = config

        result = await search_collection_handler({"collection_code": "BILLS"})

        assert len(result) == 1
        assert "Error: GOVINFO_API_KEY not configured" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.govinfo.GovInfoClient")
    @patch("src.tools.govinfo.get_config")
    async def test_search_collection_no_results(self, mock_config, mock_client_class):
        """Test search with no results."""
        # Mock config
        config = Mock()
        config.govinfo_api_key = "test-key"
        mock_config.return_value = config

        # Mock client returning empty results
        mock_client = create_async_context_manager_mock()
        mock_client.search_collection.return_value = []
        mock_client_class.return_value = mock_client

        result = await search_collection_handler(
            {
                "collection_code": "BILLS",
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
            }
        )

        assert len(result) == 1
        assert "No packages found" in result[0]["text"]


class TestGetPackageHandler:
    """Test get_govinfo_package handler."""

    @pytest.mark.asyncio
    @patch("src.tools.govinfo.GovInfoClient")
    @patch("src.tools.govinfo.get_config")
    async def test_get_package_success(self, mock_config, mock_client_class):
        """Test successful package retrieval."""
        # Mock config
        config = Mock()
        config.govinfo_api_key = "test-key"
        mock_config.return_value = config

        # Mock client
        mock_client = create_async_context_manager_mock()
        mock_client.get_package_summary.return_value = {
            "packageId": "BILLS-118hr1",
            "title": "Test Bill Title",
            "collectionCode": "BILLS",
            "collectionName": "Congressional Bills",
            "dateIssued": "2024-01-01",
            "pages": "10",
            "packageLink": "https://example.com",
            "download": {
                "pdfLink": "https://example.com/pdf",
                "txtLink": "https://example.com/txt",
                "xmlLink": "https://example.com/xml",
            },
        }
        mock_client_class.return_value = mock_client

        result = await get_package_handler({"package_id": "BILLS-118hr1"})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "BILLS-118hr1" in result[0]["text"]
        assert "Test Bill Title" in result[0]["text"]
        assert "Congressional Bills" in result[0]["text"]
        assert "PDF:" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.govinfo.get_config")
    async def test_get_package_no_api_key(self, mock_config):
        """Test package retrieval without API key."""
        # Mock config without API key
        config = Mock()
        config.govinfo_api_key = None
        mock_config.return_value = config

        result = await get_package_handler({"package_id": "BILLS-118hr1"})

        assert len(result) == 1
        assert "Error: GOVINFO_API_KEY not configured" in result[0]["text"]
