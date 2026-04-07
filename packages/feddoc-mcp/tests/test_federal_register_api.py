"""Tests for Federal Register API client."""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.clients.federal_register_api import FederalRegisterClient


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


class TestFederalRegisterClient:
    """Test FederalRegisterClient functionality."""

    def test_init(self):
        """Test client initialization."""
        client = FederalRegisterClient()
        assert client.base_url == "https://www.federalregister.gov/api/v1"
        assert client.cache_ttl == 300
        assert client.rate_limiter is not None
        client.close()

    def test_custom_cache_ttl(self):
        """Test custom cache TTL."""
        client = FederalRegisterClient(cache_ttl=600)
        assert client.cache_ttl == 600
        client.close()

    def test_get_headers(self):
        """Test request headers."""
        client = FederalRegisterClient()
        headers = client._get_headers()
        assert headers["Accept"] == "application/json"
        assert "User-Agent" in headers
        client.close()

    def test_make_cache_key(self):
        """Test cache key generation."""
        client = FederalRegisterClient()
        key1 = client._make_cache_key("/documents", {"query": "test"})
        key2 = client._make_cache_key("/documents", {"query": "test"})
        key3 = client._make_cache_key("/documents", {"query": "other"})

        assert key1 == key2  # Same params should give same key
        assert key1 != key3  # Different params should give different key
        client.close()

    @pytest.mark.asyncio
    @patch("src.clients.federal_register_api.requests.Session")
    async def test_search_documents_success(self, mock_session_class):
        """Test successful document search."""
        # Create mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [
                {
                    "title": "Test Regulation",
                    "type": "rule",
                    "publication_date": "2024-01-01",
                    "document_number": "2024-00001",
                    "abstract": "Test abstract",
                    "html_url": "https://example.com",
                    "pdf_url": "https://example.com/pdf",
                    "agencies": [{"name": "EPA"}],
                }
            ]
        }

        # Create mock session
        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session

        async with FederalRegisterClient() as client:
            documents = await client.search_documents("test", limit=10)

            assert len(documents) == 1
            assert documents[0]["title"] == "Test Regulation"
            assert documents[0]["type"] == "rule"
            assert documents[0]["document_number"] == "2024-00001"

    @pytest.mark.asyncio
    @patch("src.clients.federal_register_api.requests.Session")
    async def test_search_documents_with_filters(self, mock_session_class):
        """Test document search with filters."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"results": []}

        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session

        async with FederalRegisterClient() as client:
            await client.search_documents(
                query="test",
                document_type="rule",
                agency="EPA",
                fiscal_year=2024,
            )

            # Verify request was made with correct params
            call_args = mock_session.request.call_args
            params = call_args.kwargs["params"]
            assert params["conditions[type][]"] == "rule"
            assert params["conditions[agencies][]"] == "EPA"
            assert "conditions[publication_date][gte]" in params
            assert "conditions[publication_date][lte]" in params

    @pytest.mark.asyncio
    @patch("src.clients.federal_register_api.requests.Session")
    async def test_get_document_details(self, mock_session_class):
        """Test getting document details."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "title": "Test Regulation",
            "type": "rule",
            "publication_date": "2024-01-01",
            "document_number": "2024-00001",
            "abstract": "Test abstract",
            "agencies": [{"name": "EPA"}],
            "citation": "89 FR 12345",
            "cfr_references": [],
        }

        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session

        async with FederalRegisterClient() as client:
            doc = await client.get_document_details("2024-00001")

            assert doc["title"] == "Test Regulation"
            assert doc["document_number"] == "2024-00001"

    @pytest.mark.asyncio
    @patch("src.clients.federal_register_api.requests.Session")
    async def test_get_public_inspection_documents(self, mock_session_class):
        """Test getting public inspection documents."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [
                {
                    "document_number": "PI-2024-00001",
                    "title": "Test Document",
                    "type": "rule",
                    "agencies": [{"name": "EPA"}],
                    "filing_date": "2024-01-01",
                    "pdf_url": "https://example.com/pdf",
                }
            ]
        }

        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session

        async with FederalRegisterClient() as client:
            docs = await client.get_public_inspection_documents(agency="EPA")

            assert len(docs) == 1
            assert docs[0]["document_number"] == "PI-2024-00001"

    @pytest.mark.asyncio
    async def test_empty_query_validation(self):
        """Test that empty query raises ValueError."""
        async with FederalRegisterClient() as client:
            with pytest.raises(ValueError, match="Query cannot be empty"):
                await client.search_documents("")

    @pytest.mark.asyncio
    async def test_invalid_limit_validation(self):
        """Test that invalid limit raises ValueError."""
        async with FederalRegisterClient() as client:
            with pytest.raises(ValueError, match="Limit must be between 1 and 1000"):
                await client.search_documents("test", limit=0)

            with pytest.raises(ValueError, match="Limit must be between 1 and 1000"):
                await client.search_documents("test", limit=1001)

    @pytest.mark.asyncio
    async def test_invalid_document_type_validation(self):
        """Test that invalid document type raises ValueError."""
        async with FederalRegisterClient() as client:
            with pytest.raises(ValueError, match="document_type must be one of"):
                await client.search_documents("test", document_type="invalid")

    @pytest.mark.asyncio
    async def test_empty_document_number_validation(self):
        """Test that empty document number raises ValueError."""
        async with FederalRegisterClient() as client:
            with pytest.raises(ValueError, match="Document number cannot be empty"):
                await client.get_document_details("")

    @pytest.mark.asyncio
    @patch("src.clients.federal_register_api.requests.Session")
    async def test_caching(self, mock_session_class):
        """Test response caching."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"results": []}

        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session

        async with FederalRegisterClient() as client:
            # First request
            await client.search_documents("test")
            assert mock_session.request.call_count == 1

            # Second identical request should use cache
            await client.search_documents("test")
            assert mock_session.request.call_count == 1  # Still 1, used cache

            # Different request should not use cache
            await client.search_documents("different")
            assert mock_session.request.call_count == 2

    def test_context_manager(self):
        """Test context manager usage."""
        with FederalRegisterClient() as client:
            assert client.session is not None

    @pytest.mark.asyncio
    async def test_async_context_manager(self):
        """Test async context manager usage."""
        async with FederalRegisterClient() as client:
            assert client.session is not None
