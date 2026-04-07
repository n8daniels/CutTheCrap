"""Tests for GovInfo API client."""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.clients.govinfo_api import GovInfoClient, APIError


class TestGovInfoClient:
    """Test GovInfoClient functionality."""

    def test_init_with_valid_key(self):
        """Test client initialization with valid API key."""
        client = GovInfoClient(api_key="test-api-key")
        assert client.base_url == "https://api.govinfo.gov"
        assert client.cache_ttl == 300
        assert client.rate_limiter is not None
        assert client.api_key == "test-api-key"
        client.close()

    def test_init_without_key(self):
        """Test client initialization without API key."""
        with pytest.raises(ValueError, match="GovInfo API key is required"):
            GovInfoClient(api_key="")

    def test_init_with_whitespace_key(self):
        """Test client initialization with whitespace key."""
        with pytest.raises(ValueError, match="GovInfo API key is required"):
            GovInfoClient(api_key="   ")

    def test_custom_cache_ttl(self):
        """Test custom cache TTL."""
        client = GovInfoClient(api_key="test-key", cache_ttl=600)
        assert client.cache_ttl == 600
        client.close()

    def test_get_headers(self):
        """Test request headers."""
        client = GovInfoClient(api_key="test-api-key")
        headers = client._get_headers()
        assert headers["Accept"] == "application/json"
        assert headers["X-Api-Key"] == "test-api-key"
        assert "User-Agent" in headers
        client.close()

    def test_make_cache_key(self):
        """Test cache key generation."""
        client = GovInfoClient(api_key="test-key")
        key1 = client._make_cache_key("/collections", {"param": "test"})
        key2 = client._make_cache_key("/collections", {"param": "test"})
        key3 = client._make_cache_key("/collections", {"param": "other"})

        assert key1 == key2  # Same params should give same key
        assert key1 != key3  # Different params should give different key
        client.close()

    @pytest.mark.asyncio
    @patch("src.clients.govinfo_api.requests.Session")
    async def test_list_collections_success(self, mock_session_class):
        """Test successful collection listing."""
        # Create mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "collections": [
                {
                    "collectionCode": "BILLS",
                    "collectionName": "Congressional Bills",
                    "packageCount": 1000,
                    "granuleCount": 0,
                }
            ]
        }

        # Configure mock session
        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session

        client = GovInfoClient(api_key="test-key")
        collections = await client.list_collections()

        assert len(collections) == 1
        assert collections[0]["collectionCode"] == "BILLS"
        assert collections[0]["collectionName"] == "Congressional Bills"
        client.close()

    @pytest.mark.asyncio
    @patch("src.clients.govinfo_api.requests.Session")
    async def test_search_collection_success(self, mock_session_class):
        """Test successful collection search."""
        # Create mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "packages": [
                {
                    "packageId": "BILLS-118hr1",
                    "title": "Test Bill",
                    "dateIssued": "2024-01-01",
                    "packageLink": "https://example.com",
                }
            ]
        }

        # Configure mock session
        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session

        client = GovInfoClient(api_key="test-key")
        packages = await client.search_collection(
            collection_code="BILLS", start_date="2024-01-01", end_date="2024-01-31"
        )

        assert len(packages) == 1
        assert packages[0]["packageId"] == "BILLS-118hr1"
        client.close()

    @pytest.mark.asyncio
    async def test_search_collection_empty_code(self):
        """Test collection search with empty code."""
        client = GovInfoClient(api_key="test-key")
        with pytest.raises(ValueError, match="Collection code cannot be empty"):
            await client.search_collection(collection_code="")
        client.close()

    @pytest.mark.asyncio
    async def test_search_collection_invalid_limit(self):
        """Test collection search with invalid limit."""
        client = GovInfoClient(api_key="test-key")
        with pytest.raises(ValueError, match="Limit must be between 1 and 1000"):
            await client.search_collection(
                collection_code="BILLS",
                start_date="2024-01-01",
                end_date="2024-01-31",
                limit=0,
            )
        client.close()

    @pytest.mark.asyncio
    @patch("src.clients.govinfo_api.requests.Session")
    async def test_get_package_summary_success(self, mock_session_class):
        """Test successful package summary retrieval."""
        # Create mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "packageId": "BILLS-118hr1",
            "title": "Test Bill Title",
            "collectionCode": "BILLS",
            "collectionName": "Congressional Bills",
            "dateIssued": "2024-01-01",
            "download": {
                "pdfLink": "https://example.com/pdf",
                "txtLink": "https://example.com/txt",
                "xmlLink": "https://example.com/xml",
            },
        }

        # Configure mock session
        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session

        client = GovInfoClient(api_key="test-key")
        package = await client.get_package_summary("BILLS-118hr1")

        assert package["packageId"] == "BILLS-118hr1"
        assert package["title"] == "Test Bill Title"
        assert "download" in package
        client.close()

    @pytest.mark.asyncio
    async def test_get_package_summary_empty_id(self):
        """Test package summary with empty ID."""
        client = GovInfoClient(api_key="test-key")
        with pytest.raises(ValueError, match="Package ID cannot be empty"):
            await client.get_package_summary("")
        client.close()

    def test_clear_cache(self):
        """Test cache clearing."""
        client = GovInfoClient(api_key="test-key")
        client._cache["test"] = Mock()
        client.clear_cache()
        assert len(client._cache) == 0
        client.close()

    def test_context_manager(self):
        """Test synchronous context manager."""
        with GovInfoClient(api_key="test-key") as client:
            assert client.api_key == "test-key"
        # Client should be closed after context manager exits

    @pytest.mark.asyncio
    async def test_async_context_manager(self):
        """Test asynchronous context manager."""
        async with GovInfoClient(api_key="test-key") as client:
            assert client.api_key == "test-key"
        # Client should be closed after context manager exits
