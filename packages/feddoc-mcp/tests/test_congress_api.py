"""Tests for Congress.gov API client."""

import pytest
from unittest.mock import Mock, patch
from src.clients.congress_api import (
    CongressAPIClient,
    APIError,
    RateLimitError,
    RateLimiter,
)


class TestRateLimiter:
    """Test RateLimiter class."""

    @pytest.mark.asyncio
    async def test_rate_limiter_allows_requests(self):
        """Test that rate limiter allows requests under limit."""
        limiter = RateLimiter(max_requests=10, window_seconds=60)

        # Should allow 10 requests
        for _ in range(10):
            await limiter.acquire()

        assert len(limiter.requests) == 10

    @pytest.mark.asyncio
    async def test_rate_limiter_remaining(self):
        """Test get_remaining method."""
        limiter = RateLimiter(max_requests=5, window_seconds=60)

        assert limiter.get_remaining() == 5

        await limiter.acquire()
        assert limiter.get_remaining() == 4

        await limiter.acquire()
        await limiter.acquire()
        assert limiter.get_remaining() == 2


class TestCongressAPIClient:
    """Test CongressAPIClient class."""

    @pytest.fixture
    def mock_config(self, monkeypatch):
        """Mock configuration."""
        monkeypatch.setenv("CONGRESS_API_KEY", "test_api_key")
        from src.config import get_config

        return get_config(reload=True)

    @pytest.fixture
    def client(self, mock_config):
        """Create API client for testing."""
        return CongressAPIClient(api_key="test_api_key")

    def test_client_initialization(self, client):
        """Test client initializes correctly."""
        assert client.api_key == "test_api_key"
        assert client.base_url == "https://api.congress.gov/v3"
        assert client.rate_limiter is not None
        assert client.session is not None

    def test_get_headers(self, client):
        """Test header generation."""
        headers = client._get_headers()

        assert "X-Api-Key" in headers
        assert headers["X-Api-Key"] == "test_api_key"
        assert headers["Accept"] == "application/json"

    @pytest.mark.asyncio
    async def test_search_bills_validation(self, client):
        """Test search_bills input validation."""
        # Empty query
        with pytest.raises(ValueError, match="Query cannot be empty"):
            await client.search_bills(query="")

        # Invalid limit
        with pytest.raises(ValueError, match="Limit must be between"):
            await client.search_bills(query="test", limit=0)

        with pytest.raises(ValueError, match="Limit must be between"):
            await client.search_bills(query="test", limit=300)

        # Invalid offset
        with pytest.raises(ValueError, match="Offset must be non-negative"):
            await client.search_bills(query="test", offset=-1)

        # Invalid bill type
        with pytest.raises(ValueError, match="bill_type must be one of"):
            await client.search_bills(query="test", bill_type="invalid")

    @pytest.mark.asyncio
    async def test_get_bill_details_validation(self, client):
        """Test get_bill_details input validation."""
        # Invalid congress
        with pytest.raises(ValueError, match="Congress number must be positive"):
            await client.get_bill_details(congress=0, bill_type="hr", bill_number=1)

        # Invalid bill number
        with pytest.raises(ValueError, match="Bill number must be positive"):
            await client.get_bill_details(congress=118, bill_type="hr", bill_number=0)

        # Invalid bill type
        with pytest.raises(ValueError, match="bill_type must be one of"):
            await client.get_bill_details(
                congress=118, bill_type="invalid", bill_number=1
            )

    @pytest.mark.asyncio
    async def test_get_bill_text_validation(self, client):
        """Test get_bill_text input validation."""
        # Invalid format
        with pytest.raises(ValueError, match="format must be one of"):
            await client.get_bill_text(
                congress=118, bill_type="hr", bill_number=1, format="invalid"
            )

    @pytest.mark.asyncio
    @patch("src.clients.congress_api.requests.Session.request")
    async def test_make_request_success(self, mock_request, client):
        """Test successful API request."""
        # Mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"bills": [{"title": "Test Bill"}]}
        mock_request.return_value = mock_response

        result = await client._make_request("/bill", {"limit": 1})

        assert result == {"bills": [{"title": "Test Bill"}]}
        mock_request.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.clients.congress_api.requests.Session.request")
    async def test_make_request_401_error(self, mock_request, client):
        """Test API request with 401 Unauthorized."""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_request.return_value = mock_response

        with pytest.raises(APIError, match="Invalid API key"):
            await client._make_request("/bill")

    @pytest.mark.asyncio
    @patch("src.clients.congress_api.requests.Session.request")
    async def test_make_request_429_error(self, mock_request, client):
        """Test API request with 429 Rate Limit."""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_request.return_value = mock_response

        with pytest.raises(RateLimitError, match="Rate limit exceeded"):
            await client._make_request("/bill")

    def test_context_manager(self, client):
        """Test client works as context manager."""
        with CongressAPIClient(api_key="test_key") as client:
            assert client is not None

        # Session should be closed after context
        # (we can't easily test this without mocking)

    def test_close(self, client):
        """Test client close method."""
        # Should not raise
        client.close()
