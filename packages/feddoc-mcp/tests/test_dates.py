"""Tests for date utilities."""

import pytest
from datetime import datetime
from src.utils.dates import (
    fiscal_year_to_dates,
    validate_date_format,
    validate_date_range,
    get_default_date_window,
    parse_date_parameters,
)


class TestFiscalYearToDates:
    """Test fiscal_year_to_dates function."""

    def test_fiscal_year_2024(self):
        """Test FY 2024 conversion."""
        start, end = fiscal_year_to_dates(2024)
        assert start == "2023-10-01"
        assert end == "2024-09-30"

    def test_fiscal_year_2023(self):
        """Test FY 2023 conversion."""
        start, end = fiscal_year_to_dates(2023)
        assert start == "2022-10-01"
        assert end == "2023-09-30"

    def test_fiscal_year_1789(self):
        """Test earliest valid fiscal year."""
        start, end = fiscal_year_to_dates(1789)
        assert start == "1788-10-01"
        assert end == "1789-09-30"

    def test_fiscal_year_too_early(self):
        """Test that fiscal years before 1789 are rejected."""
        with pytest.raises(ValueError, match="must be 1789 or later"):
            fiscal_year_to_dates(1788)

    def test_fiscal_year_too_far_future(self):
        """Test that far future fiscal years are rejected."""
        future_year = datetime.now().year + 20
        with pytest.raises(ValueError, match="too far in the future"):
            fiscal_year_to_dates(future_year)


class TestValidateDateFormat:
    """Test validate_date_format function."""

    def test_valid_format(self):
        """Test valid ISO date format."""
        assert validate_date_format("2024-01-15") is True
        assert validate_date_format("2023-12-31") is True
        assert validate_date_format("2024-02-29") is True  # Leap year

    def test_invalid_format(self):
        """Test invalid date formats."""
        # Note: Python's strptime is forgiving with padding, so 2024-1-15 is technically valid
        assert validate_date_format("01/15/2024") is False  # US format
        assert validate_date_format("15-01-2024") is False  # DD-MM-YYYY
        assert validate_date_format("2024-13-01") is False  # Invalid month
        assert validate_date_format("2024-02-30") is False  # Invalid day
        assert validate_date_format("not a date") is False
        assert validate_date_format("") is False

    def test_none_input(self):
        """Test None input."""
        assert validate_date_format(None) is False


class TestValidateDateRange:
    """Test validate_date_range function."""

    def test_valid_range(self):
        """Test valid date range."""
        # Should not raise
        validate_date_range("2024-01-01", "2024-12-31")
        validate_date_range("2020-01-01", "2025-01-01")  # 5 years, clearly under 10

    def test_invalid_start_format(self):
        """Test invalid start date format."""
        with pytest.raises(ValueError, match="start_date must be in YYYY-MM-DD format"):
            validate_date_range("01/01/2024", "2024-12-31")

    def test_invalid_end_format(self):
        """Test invalid end date format."""
        with pytest.raises(ValueError, match="end_date must be in YYYY-MM-DD format"):
            validate_date_range("2024-01-01", "12/31/2024")

    def test_start_after_end(self):
        """Test start date after end date."""
        with pytest.raises(ValueError, match="start_date must be before end_date"):
            validate_date_range("2024-12-31", "2024-01-01")

    def test_start_equals_end(self):
        """Test start date equals end date."""
        with pytest.raises(ValueError, match="start_date must be before end_date"):
            validate_date_range("2024-01-01", "2024-01-01")

    def test_range_too_large(self):
        """Test date range exceeding max years."""
        with pytest.raises(ValueError, match="cannot exceed 10 years"):
            validate_date_range("2020-01-01", "2031-01-01")  # > 10 years

    def test_custom_max_years(self):
        """Test with custom max years."""
        # Should not raise with max_years=20
        validate_date_range("2020-01-01", "2035-01-01", max_years=20)

        # Should raise with max_years=5
        with pytest.raises(ValueError, match="cannot exceed 5 years"):
            validate_date_range("2020-01-01", "2026-01-01", max_years=5)


class TestGetDefaultDateWindow:
    """Test get_default_date_window function."""

    def test_default_two_years(self):
        """Test default 2-year window."""
        start, end = get_default_date_window()

        # Parse dates
        start_date = datetime.strptime(start, "%Y-%m-%d")
        end_date = datetime.strptime(end, "%Y-%m-%d")

        # Check that end is approximately today
        today = datetime.now()
        assert abs((end_date - today).days) <= 1  # Within 1 day

        # Check that start is approximately 2 years before end
        delta_days = (end_date - start_date).days
        expected_days = 365 * 2
        assert abs(delta_days - expected_days) <= 2  # Account for leap years

    def test_custom_window(self):
        """Test custom window size."""
        start, end = get_default_date_window(years=5)

        start_date = datetime.strptime(start, "%Y-%m-%d")
        end_date = datetime.strptime(end, "%Y-%m-%d")

        delta_days = (end_date - start_date).days
        expected_days = 365 * 5
        assert abs(delta_days - expected_days) <= 5  # Account for leap years


class TestParseDateParameters:
    """Test parse_date_parameters function."""

    def test_fiscal_year_only(self):
        """Test with fiscal_year parameter."""
        start, end = parse_date_parameters(fiscal_year=2024)
        assert start == "2023-10-01"
        assert end == "2024-09-30"

    def test_date_range_only(self):
        """Test with start_date and end_date."""
        start, end = parse_date_parameters(
            start_date="2024-01-01", end_date="2024-12-31"
        )
        assert start == "2024-01-01"
        assert end == "2024-12-31"

    def test_no_parameters(self):
        """Test with no parameters (default window)."""
        start, end = parse_date_parameters()

        # Should return a valid date range
        assert validate_date_format(start)
        assert validate_date_format(end)

        # Should be approximately 2 years
        start_date = datetime.strptime(start, "%Y-%m-%d")
        end_date = datetime.strptime(end, "%Y-%m-%d")
        delta_days = (end_date - start_date).days
        assert 700 <= delta_days <= 735  # ~2 years (accounting for leap years)

    def test_conflicting_fiscal_year_and_dates(self):
        """Test that fiscal_year conflicts with start_date/end_date."""
        with pytest.raises(
            ValueError, match="Cannot specify both fiscal_year and start_date/end_date"
        ):
            parse_date_parameters(
                fiscal_year=2024, start_date="2024-01-01", end_date="2024-12-31"
            )

        with pytest.raises(
            ValueError, match="Cannot specify both fiscal_year and start_date/end_date"
        ):
            parse_date_parameters(fiscal_year=2024, start_date="2024-01-01")

    def test_start_date_without_end_date(self):
        """Test that start_date requires end_date."""
        with pytest.raises(
            ValueError, match="If start_date is provided, end_date is also required"
        ):
            parse_date_parameters(start_date="2024-01-01")

    def test_end_date_without_start_date(self):
        """Test that end_date requires start_date."""
        with pytest.raises(
            ValueError, match="If end_date is provided, start_date is also required"
        ):
            parse_date_parameters(end_date="2024-12-31")

    def test_invalid_date_range(self):
        """Test that invalid date ranges are rejected."""
        with pytest.raises(ValueError):
            parse_date_parameters(
                start_date="2024-12-31", end_date="2024-01-01"  # End before start
            )

    def test_custom_default_window(self):
        """Test with custom default window."""
        start, end = parse_date_parameters(default_window_years=5)

        start_date = datetime.strptime(start, "%Y-%m-%d")
        end_date = datetime.strptime(end, "%Y-%m-%d")
        delta_days = (end_date - start_date).days

        # Should be approximately 5 years
        assert 1800 <= delta_days <= 1835  # ~5 years
