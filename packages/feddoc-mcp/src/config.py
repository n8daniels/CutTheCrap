"""
Configuration management for FedDocMCP.

Handles loading and validating configuration from environment variables.
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv


class ConfigError(Exception):
    """Raised when configuration is invalid."""

    pass


class Config:
    """
    Application configuration.

    Loads configuration from environment variables and provides
    validation and defaults.
    """

    def __init__(self, load_env: bool = True) -> None:
        """
        Initialize configuration.

        Args:
            load_env: Whether to load .env file (default: True)

        Raises:
            ConfigError: If required configuration is missing or invalid
        """
        if load_env:
            load_dotenv()

        # Required configuration
        self.congress_api_key = os.getenv("CONGRESS_API_KEY")

        # Optional API keys
        self.govinfo_api_key = os.getenv("GOVINFO_API_KEY")

        # Optional configuration with defaults
        self.api_base_url = os.getenv(
            "CONGRESS_API_BASE_URL", "https://api.congress.gov/v3"
        )

        self.rate_limit = int(os.getenv("CONGRESS_API_RATE_LIMIT", "5000"))
        self.rate_limit_window = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

        self.log_level = os.getenv("LOG_LEVEL", "INFO").upper()

        # Cache configuration (for future use)
        self.enable_cache = os.getenv("ENABLE_CACHE", "false").lower() == "true"
        self.cache_ttl = int(os.getenv("CACHE_TTL", "3600"))

        # Development mode
        self.dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"

        # Validate configuration
        self.validate()

        # Set up logging
        self.setup_logging()

    def validate(self) -> None:
        """
        Validate configuration.

        Raises:
            ConfigError: If configuration is invalid
        """
        if not self.congress_api_key:
            raise ConfigError(
                "CONGRESS_API_KEY is required. "
                "Get one at https://api.congress.gov/sign-up/"
            )

        if self.rate_limit <= 0:
            raise ConfigError("CONGRESS_API_RATE_LIMIT must be positive")

        if self.rate_limit_window <= 0:
            raise ConfigError("RATE_LIMIT_WINDOW must be positive")

        valid_log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.log_level not in valid_log_levels:
            raise ConfigError(
                f"LOG_LEVEL must be one of {valid_log_levels}, got {self.log_level}"
            )

    def setup_logging(self) -> None:
        """Set up logging configuration."""
        logging.basicConfig(
            level=getattr(logging, self.log_level),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    def __repr__(self) -> str:
        """Return string representation (without sensitive data)."""
        return (
            f"Config("
            f"api_base_url={self.api_base_url}, "
            f"rate_limit={self.rate_limit}, "
            f"log_level={self.log_level}, "
            f"dev_mode={self.dev_mode})"
        )


# Global config instance
_config: Optional[Config] = None


def get_config(reload: bool = False) -> Config:
    """
    Get the global configuration instance.

    Args:
        reload: Whether to reload configuration (default: False)

    Returns:
        Config instance

    Raises:
        ConfigError: If configuration is invalid
    """
    global _config

    if _config is None or reload:
        _config = Config()

    return _config
