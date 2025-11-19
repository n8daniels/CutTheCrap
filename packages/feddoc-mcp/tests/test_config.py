"""Tests for configuration management."""

import pytest
from src.config import Config, ConfigError, get_config


class TestConfig:
    """Test Config class."""

    def test_config_missing_api_key(self, monkeypatch):
        """Test that Config raises error when API key is missing."""
        monkeypatch.delenv("CONGRESS_API_KEY", raising=False)

        with pytest.raises(ConfigError, match="CONGRESS_API_KEY is required"):
            Config(load_env=False)

    def test_config_with_api_key(self, monkeypatch):
        """Test Config with valid API key."""
        monkeypatch.setenv("CONGRESS_API_KEY", "test_key_123")

        config = Config(load_env=False)

        assert config.congress_api_key == "test_key_123"
        assert config.api_base_url == "https://api.congress.gov/v3"
        assert config.rate_limit == 5000
        assert config.log_level == "INFO"

    def test_config_with_custom_values(self, monkeypatch):
        """Test Config with custom environment values."""
        monkeypatch.setenv("CONGRESS_API_KEY", "custom_key")
        monkeypatch.setenv("CONGRESS_API_BASE_URL", "https://custom.api.url")
        monkeypatch.setenv("CONGRESS_API_RATE_LIMIT", "1000")
        monkeypatch.setenv("LOG_LEVEL", "DEBUG")

        config = Config(load_env=False)

        assert config.congress_api_key == "custom_key"
        assert config.api_base_url == "https://custom.api.url"
        assert config.rate_limit == 1000
        assert config.log_level == "DEBUG"

    def test_config_invalid_rate_limit(self, monkeypatch):
        """Test that Config raises error for invalid rate limit."""
        monkeypatch.setenv("CONGRESS_API_KEY", "test_key")
        monkeypatch.setenv("CONGRESS_API_RATE_LIMIT", "-1")

        with pytest.raises(
            ConfigError, match="CONGRESS_API_RATE_LIMIT must be positive"
        ):
            Config(load_env=False)

    def test_config_invalid_log_level(self, monkeypatch):
        """Test that Config raises error for invalid log level."""
        monkeypatch.setenv("CONGRESS_API_KEY", "test_key")
        monkeypatch.setenv("LOG_LEVEL", "INVALID")

        with pytest.raises(ConfigError, match="LOG_LEVEL must be one of"):
            Config(load_env=False)

    def test_get_config(self, monkeypatch):
        """Test get_config function."""
        monkeypatch.setenv("CONGRESS_API_KEY", "test_key")

        config1 = get_config()
        config2 = get_config()

        # Should return same instance
        assert config1 is config2

    def test_config_repr(self, monkeypatch):
        """Test that config repr doesn't expose sensitive data."""
        monkeypatch.setenv("CONGRESS_API_KEY", "secret_key_123")

        config = Config(load_env=False)
        repr_str = repr(config)

        # Should not contain API key
        assert "secret_key_123" not in repr_str
        # Should contain non-sensitive data
        assert "api_base_url" in repr_str
        assert "rate_limit" in repr_str
