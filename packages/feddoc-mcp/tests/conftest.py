"""Pytest configuration and shared fixtures."""

import pytest
from unittest.mock import AsyncMock


@pytest.fixture(autouse=True)
def reset_config():
    """Reset global config before each test."""
    import src.config

    src.config._config = None
    yield
    src.config._config = None


@pytest.fixture
def mock_env(monkeypatch):
    """Provide a clean environment with test API key."""
    monkeypatch.setenv("CONGRESS_API_KEY", "test_api_key_12345")
    monkeypatch.setenv("LOG_LEVEL", "ERROR")  # Reduce log noise in tests
    return monkeypatch


@pytest.fixture
def sample_bill_data():
    """Sample bill data for testing."""
    return {
        "type": "hr",
        "number": 1,
        "congress": 118,
        "title": "Test Bill for Testing Purposes",
        "introducedDate": "2023-01-03",
        "sponsor": {"name": "Rep. Test Person", "party": "D", "state": "CA"},
        "latestAction": {
            "actionDate": "2023-01-10",
            "text": "Referred to the Committee on Test",
        },
    }


@pytest.fixture
def sample_bill_list():
    """Sample list of bills for testing."""
    return [
        {
            "type": "hr",
            "number": 1,
            "congress": 118,
            "title": "First Test Bill",
            "introducedDate": "2023-01-03",
        },
        {
            "type": "s",
            "number": 100,
            "congress": 118,
            "title": "Second Test Bill",
            "introducedDate": "2023-01-04",
        },
        {
            "type": "hr",
            "number": 50,
            "congress": 118,
            "title": "Third Test Bill",
            "introducedDate": "2023-01-05",
        },
    ]


@pytest.fixture
def mock_congress_client():
    """Create a mock CongressAPIClient that works as async context manager."""
    mock_client = AsyncMock()

    # Make it work as an async context manager
    async def async_enter(*args, **kwargs):
        return mock_client

    async def async_exit(*args, **kwargs):
        return None

    mock_client.__aenter__ = AsyncMock(side_effect=async_enter)
    mock_client.__aexit__ = AsyncMock(side_effect=async_exit)

    return mock_client
