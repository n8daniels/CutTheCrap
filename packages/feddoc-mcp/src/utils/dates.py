"""
Date utilities for FedDocMCP.

Handles fiscal year conversions, date range validation, and default date windows.
"""

from datetime import datetime, timedelta
from typing import Tuple, Optional


def fiscal_year_to_dates(fiscal_year: int) -> Tuple[str, str]:
    """
    Convert a federal fiscal year to start and end dates.

    Federal fiscal years run from October 1 to September 30.
    For example, FY 2024 runs from October 1, 2023 to September 30, 2024.

    Args:
        fiscal_year: Federal fiscal year (e.g., 2024)

    Returns:
        Tuple of (start_date, end_date) in ISO format (YYYY-MM-DD)

    Raises:
        ValueError: If fiscal_year is invalid

    Examples:
        >>> fiscal_year_to_dates(2024)
        ('2023-10-01', '2024-09-30')

        >>> fiscal_year_to_dates(2023)
        ('2022-10-01', '2023-09-30')
    """
    if fiscal_year < 1789:  # First Congress
        raise ValueError("Fiscal year must be 1789 or later")

    if fiscal_year > datetime.now().year + 10:
        raise ValueError(f"Fiscal year {fiscal_year} is too far in the future")

    # FY starts October 1 of the previous calendar year
    start_date = f"{fiscal_year - 1}-10-01"
    # FY ends September 30 of the fiscal year
    end_date = f"{fiscal_year}-09-30"

    return start_date, end_date


def validate_date_format(date_string: str) -> bool:
    """
    Validate that a date string is in ISO format (YYYY-MM-DD).

    Args:
        date_string: Date string to validate

    Returns:
        True if valid, False otherwise

    Examples:
        >>> validate_date_format("2024-01-15")
        True

        >>> validate_date_format("2024-1-15")
        False

        >>> validate_date_format("01/15/2024")
        False
    """
    try:
        datetime.strptime(date_string, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


def validate_date_range(start_date: str, end_date: str, max_years: int = 10) -> None:
    """
    Validate a date range.

    Args:
        start_date: Start date in ISO format (YYYY-MM-DD)
        end_date: End date in ISO format (YYYY-MM-DD)
        max_years: Maximum allowed range in years (default: 10)

    Raises:
        ValueError: If date range is invalid

    Examples:
        >>> validate_date_range("2024-01-01", "2024-12-31")
        # No error

        >>> validate_date_range("2024-01-01", "2023-01-01")
        ValueError: start_date must be before end_date
    """
    # Validate formats
    if not validate_date_format(start_date):
        raise ValueError(f"start_date must be in YYYY-MM-DD format, got: {start_date}")

    if not validate_date_format(end_date):
        raise ValueError(f"end_date must be in YYYY-MM-DD format, got: {end_date}")

    # Parse dates
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")

    # Check order
    if start >= end:
        raise ValueError("start_date must be before end_date")

    # Check range
    max_delta = timedelta(days=365 * max_years)
    if (end - start) > max_delta:
        raise ValueError(f"Date range cannot exceed {max_years} years")


def get_default_date_window(years: int = 2) -> Tuple[str, str]:
    """
    Get a default date window ending today.

    Args:
        years: Number of years to look back (default: 2)

    Returns:
        Tuple of (start_date, end_date) in ISO format

    Examples:
        >>> # If today is 2024-11-15
        >>> get_default_date_window(2)
        ('2022-11-15', '2024-11-15')
    """
    end = datetime.now()
    start = end - timedelta(days=365 * years)

    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def parse_date_parameters(
    fiscal_year: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    default_window_years: int = 2,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Parse and validate date parameters, returning a final date range.

    Priority order:
    1. If fiscal_year is provided, use that
    2. If start_date and/or end_date are provided, use those
    3. If no parameters provided, use default window

    Args:
        fiscal_year: Federal fiscal year
        start_date: Start date in ISO format
        end_date: End date in ISO format
        default_window_years: Default window size if no params (default: 2)

    Returns:
        Tuple of (start_date, end_date) in ISO format, or (None, None) if no filtering

    Raises:
        ValueError: If parameters are invalid or conflicting

    Examples:
        >>> parse_date_parameters(fiscal_year=2024)
        ('2023-10-01', '2024-09-30')

        >>> parse_date_parameters(start_date="2024-01-01", end_date="2024-12-31")
        ('2024-01-01', '2024-12-31')

        >>> parse_date_parameters()
        ('2022-11-15', '2024-11-15')  # Assuming today is 2024-11-15
    """
    # Check for conflicting parameters
    if fiscal_year and (start_date or end_date):
        raise ValueError(
            "Cannot specify both fiscal_year and start_date/end_date. "
            "Use fiscal_year OR date range, not both."
        )

    # Option 1: Fiscal year
    if fiscal_year:
        return fiscal_year_to_dates(fiscal_year)

    # Option 2: Explicit date range
    if start_date or end_date:
        # If only one is provided, we need both for the API
        if start_date and not end_date:
            raise ValueError("If start_date is provided, end_date is also required")
        if end_date and not start_date:
            raise ValueError("If end_date is provided, start_date is also required")

        # At this point, both must be non-None (type guard for mypy)
        assert start_date is not None and end_date is not None

        # Validate the range
        validate_date_range(start_date, end_date)
        return start_date, end_date

    # Option 3: Default window
    return get_default_date_window(default_window_years)
