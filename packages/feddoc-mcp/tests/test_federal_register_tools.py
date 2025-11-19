"""Tests for Federal Register tools."""

import pytest
from unittest.mock import AsyncMock, patch
from src.tools.federal_register import (
    search_regulations_handler,
    get_regulation_details_handler,
    get_public_inspection_handler,
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


class TestSearchRegulationsHandler:
    """Test search_regulations tool handler."""

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_search_regulations_success(self, mock_client_class):
        """Test successful regulation search."""
        mock_client = create_async_context_manager_mock()
        mock_client.search_documents.return_value = [
            {
                "title": "Environmental Protection Regulation",
                "type": "rule",
                "publication_date": "2024-01-15",
                "document_number": "2024-00123",
                "abstract": "New EPA regulation for clean air",
                "html_url": "https://example.com",
                "pdf_url": "https://example.com/pdf",
                "agencies": [{"name": "Environmental Protection Agency"}],
            }
        ]
        mock_client_class.return_value = mock_client

        result = await search_regulations_handler({"query": "environment", "limit": 10})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Environmental Protection Regulation" in result[0]["text"]
        assert "2024-00123" in result[0]["text"]
        assert "Environmental Protection Agency" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_search_regulations_no_results(self, mock_client_class):
        """Test search with no results."""
        mock_client = create_async_context_manager_mock()
        mock_client.search_documents.return_value = []
        mock_client_class.return_value = mock_client

        result = await search_regulations_handler({"query": "nonexistent"})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "No documents found" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_search_regulations_with_filters(self, mock_client_class):
        """Test search with filters."""
        mock_client = create_async_context_manager_mock()
        mock_client.search_documents.return_value = [
            {
                "title": "EPA Rule",
                "type": "rule",
                "publication_date": "2024-01-01",
                "document_number": "2024-00001",
                "abstract": "",
                "html_url": "",
                "pdf_url": "",
                "agencies": [{"name": "EPA"}],
            }
        ]
        mock_client_class.return_value = mock_client

        await search_regulations_handler(
            {
                "query": "test",
                "document_type": "rule",
                "agency": "EPA",
                "fiscal_year": 2024,
            }
        )

        # Verify client was called with correct parameters
        mock_client.search_documents.assert_called_once()
        call_kwargs = mock_client.search_documents.call_args.kwargs
        assert call_kwargs["query"] == "test"
        assert call_kwargs["document_type"] == "rule"
        assert call_kwargs["agency"] == "EPA"
        assert call_kwargs["fiscal_year"] == 2024

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_search_regulations_validation_error(self, mock_client_class):
        """Test search with validation error."""
        mock_client = create_async_context_manager_mock()
        mock_client.search_documents.side_effect = ValueError("Invalid parameter")
        mock_client_class.return_value = mock_client

        result = await search_regulations_handler({"query": "test"})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Error:" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_search_regulations_api_error(self, mock_client_class):
        """Test search with API error."""
        from src.clients.federal_register_api import APIError

        mock_client = create_async_context_manager_mock()
        mock_client.search_documents.side_effect = APIError("API request failed")
        mock_client_class.return_value = mock_client

        result = await search_regulations_handler({"query": "test"})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "API Error:" in result[0]["text"]


class TestGetRegulationDetailsHandler:
    """Test get_regulation_details tool handler."""

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_get_regulation_details_success(self, mock_client_class):
        """Test successful regulation details retrieval."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_document_details.return_value = {
            "title": "Test Regulation",
            "type": "rule",
            "publication_date": "2024-01-01",
            "document_number": "2024-00001",
            "abstract": "This is a test regulation",
            "html_url": "https://example.com",
            "pdf_url": "https://example.com/pdf",
            "full_text_xml_url": "https://example.com/xml",
            "agencies": [{"name": "EPA"}],
            "citation": "89 FR 12345",
            "cfr_references": [{"title": "40", "part": "52"}],
        }
        mock_client_class.return_value = mock_client

        result = await get_regulation_details_handler({"document_number": "2024-00001"})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Test Regulation" in result[0]["text"]
        assert "2024-00001" in result[0]["text"]
        assert "EPA" in result[0]["text"]
        assert "89 FR 12345" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_get_regulation_details_minimal(self, mock_client_class):
        """Test regulation details with minimal data."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_document_details.return_value = {
            "title": "Minimal Regulation",
            "type": "notice",
            "publication_date": "2024-01-01",
            "abstract": "Test",
            "agencies": [],
        }
        mock_client_class.return_value = mock_client

        result = await get_regulation_details_handler({"document_number": "2024-00001"})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Minimal Regulation" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_get_regulation_details_error(self, mock_client_class):
        """Test regulation details with error."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_document_details.side_effect = Exception("Not found")
        mock_client_class.return_value = mock_client

        result = await get_regulation_details_handler({"document_number": "2024-00001"})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Error retrieving" in result[0]["text"]


class TestGetPublicInspectionHandler:
    """Test get_public_inspection_documents tool handler."""

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_get_public_inspection_success(self, mock_client_class):
        """Test successful public inspection documents retrieval."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_public_inspection_documents.return_value = [
            {
                "title": "Public Inspection Document",
                "type": "rule",
                "document_number": "PI-2024-00001",
                "filing_date": "2024-01-15",
                "pdf_url": "https://example.com/pdf",
                "agencies": [{"name": "EPA"}],
            }
        ]
        mock_client_class.return_value = mock_client

        result = await get_public_inspection_handler({})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Public Inspection Document" in result[0]["text"]
        assert "PI-2024-00001" in result[0]["text"]
        assert "EPA" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_get_public_inspection_with_agency(self, mock_client_class):
        """Test public inspection documents filtered by agency."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_public_inspection_documents.return_value = []
        mock_client_class.return_value = mock_client

        await get_public_inspection_handler({"agency": "EPA"})

        # Verify client was called with correct parameters
        mock_client.get_public_inspection_documents.assert_called_once()
        call_kwargs = mock_client.get_public_inspection_documents.call_args.kwargs
        assert call_kwargs["agency"] == "EPA"
        assert call_kwargs["special_filing"] is False

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_get_public_inspection_special_filing(self, mock_client_class):
        """Test public inspection with special filing filter."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_public_inspection_documents.return_value = []
        mock_client_class.return_value = mock_client

        await get_public_inspection_handler({"special_filing": True})

        # Verify client was called with correct parameters
        call_kwargs = mock_client.get_public_inspection_documents.call_args.kwargs
        assert call_kwargs["special_filing"] is True

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_get_public_inspection_no_results(self, mock_client_class):
        """Test public inspection with no results."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_public_inspection_documents.return_value = []
        mock_client_class.return_value = mock_client

        result = await get_public_inspection_handler({})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "No documents currently on public inspection" in result[0]["text"]

    @pytest.mark.asyncio
    @patch("src.tools.federal_register.FederalRegisterClient")
    async def test_get_public_inspection_error(self, mock_client_class):
        """Test public inspection with error."""
        mock_client = create_async_context_manager_mock()
        mock_client.get_public_inspection_documents.side_effect = Exception("API error")
        mock_client_class.return_value = mock_client

        result = await get_public_inspection_handler({})

        assert len(result) == 1
        assert result[0]["type"] == "text"
        assert "Error retrieving" in result[0]["text"]
