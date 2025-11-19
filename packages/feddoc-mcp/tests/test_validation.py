"""Tests for enhanced validation utilities."""

import pytest
from src.utils.validation import (
    ValidationError,
    Validator,
    sanitize_string,
    normalize_case,
    coerce_to_int,
)


class TestValidationError:
    """Test ValidationError class."""

    def test_validation_error_basic(self) -> None:
        """Test basic validation error."""
        error = ValidationError(
            field="query", value="", message="Query cannot be empty"
        )

        assert error.field == "query"
        assert error.value == ""
        assert error.message == "Query cannot be empty"
        assert "Validation error for 'query'" in str(error)

    def test_validation_error_with_hint(self) -> None:
        """Test validation error with hint."""
        error = ValidationError(
            field="limit",
            value=200,
            message="Limit must be <= 100",
            hint="Please use a limit between 1 and 100",
        )

        error_str = str(error)
        assert "Hint: Please use a limit between 1 and 100" in error_str

    def test_validation_error_with_valid_values(self) -> None:
        """Test validation error with valid values list."""
        error = ValidationError(
            field="bill_type",
            value="invalid",
            message="Invalid bill type",
            valid_values=["hr", "s", "hjres", "sjres"],
        )

        error_str = str(error)
        assert "Valid values: hr, s, hjres, sjres" in error_str


class TestValidatorRequired:
    """Test Validator.required method."""

    def test_required_valid(self) -> None:
        """Test required validation with valid value."""
        Validator.required("test value", "query")  # Should not raise

    def test_required_none(self) -> None:
        """Test required validation with None."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.required(None, "query")

        assert exc_info.value.field == "query"
        assert "missing or empty" in str(exc_info.value)

    def test_required_empty_string(self) -> None:
        """Test required validation with empty string."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.required("", "query")

        assert exc_info.value.field == "query"

    def test_required_with_hint(self) -> None:
        """Test required validation with custom hint."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.required(
                None, "api_key", hint="Get your API key from congress.gov"
            )

        assert "Get your API key from congress.gov" in str(exc_info.value)


class TestValidatorStringNotEmpty:
    """Test Validator.string_not_empty method."""

    def test_string_not_empty_valid(self) -> None:
        """Test with valid non-empty string."""
        Validator.string_not_empty("test", "query")  # Should not raise

    def test_string_not_empty_none(self) -> None:
        """Test with None (should pass)."""
        Validator.string_not_empty(None, "query")  # Should not raise

    def test_string_not_empty_empty(self) -> None:
        """Test with empty string."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.string_not_empty("", "query")

        assert "cannot be empty" in str(exc_info.value)

    def test_string_not_empty_whitespace(self) -> None:
        """Test with whitespace-only string."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.string_not_empty("   ", "query")

        assert "cannot be empty or whitespace" in str(exc_info.value)


class TestValidatorIntegerRange:
    """Test Validator.integer_range method."""

    def test_integer_range_valid(self) -> None:
        """Test with valid integer in range."""
        Validator.integer_range(50, "limit", min_value=1, max_value=100)

    def test_integer_range_min_only(self) -> None:
        """Test with minimum value only."""
        Validator.integer_range(10, "congress", min_value=1)

    def test_integer_range_max_only(self) -> None:
        """Test with maximum value only."""
        Validator.integer_range(50, "limit", max_value=100)

    def test_integer_range_none(self) -> None:
        """Test with None (should pass)."""
        Validator.integer_range(None, "limit", min_value=1, max_value=100)

    def test_integer_range_below_min(self) -> None:
        """Test with value below minimum."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.integer_range(0, "limit", min_value=1, max_value=100)

        assert "must be >= 1" in str(exc_info.value)

    def test_integer_range_above_max(self) -> None:
        """Test with value above maximum."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.integer_range(200, "limit", min_value=1, max_value=100)

        assert "must be <= 100" in str(exc_info.value)

    def test_integer_range_not_integer(self) -> None:
        """Test with non-integer value."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.integer_range("50", "limit", min_value=1, max_value=100)

        assert "must be an integer" in str(exc_info.value)


class TestValidatorOneOf:
    """Test Validator.one_of method."""

    def test_one_of_valid(self) -> None:
        """Test with valid value."""
        Validator.one_of("hr", "bill_type", ["hr", "s", "hjres", "sjres"])

    def test_one_of_none(self) -> None:
        """Test with None (should pass)."""
        Validator.one_of(None, "bill_type", ["hr", "s"])

    def test_one_of_invalid(self) -> None:
        """Test with invalid value."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.one_of("invalid", "bill_type", ["hr", "s"])

        error = exc_info.value
        assert error.field == "bill_type"
        assert error.valid_values == ["hr", "s"]

    def test_one_of_case_insensitive(self) -> None:
        """Test case-insensitive validation."""
        Validator.one_of("HR", "bill_type", ["hr", "s"], case_sensitive=False)

    def test_one_of_case_sensitive(self) -> None:
        """Test case-sensitive validation."""
        with pytest.raises(ValidationError):
            Validator.one_of("HR", "bill_type", ["hr", "s"], case_sensitive=True)


class TestValidatorPattern:
    """Test Validator.pattern method."""

    def test_pattern_valid(self) -> None:
        """Test with valid pattern match."""
        Validator.pattern(
            "2024-01-15", "date", r"^\d{4}-\d{2}-\d{2}$", "YYYY-MM-DD format"
        )

    def test_pattern_none(self) -> None:
        """Test with None (should pass)."""
        Validator.pattern(None, "date", r"^\d{4}-\d{2}-\d{2}$", "YYYY-MM-DD")

    def test_pattern_invalid(self) -> None:
        """Test with invalid pattern."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.pattern(
                "01-15-2024", "date", r"^\d{4}-\d{2}-\d{2}$", "YYYY-MM-DD format"
            )

        assert "must match pattern" in str(exc_info.value)
        assert "YYYY-MM-DD" in str(exc_info.value)

    def test_pattern_not_string(self) -> None:
        """Test with non-string value."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.pattern(12345, "date", r"^\d+$", "digits only")

        assert "must be a string" in str(exc_info.value)


class TestValidatorMutuallyExclusive:
    """Test Validator.mutually_exclusive method."""

    def test_mutually_exclusive_none_provided(self) -> None:
        """Test with no fields provided."""
        fields = {"other": "value"}
        Validator.mutually_exclusive(fields, ["fiscal_year", "start_date", "end_date"])

    def test_mutually_exclusive_one_provided(self) -> None:
        """Test with one field provided."""
        fields = {"fiscal_year": 2024, "other": "value"}
        Validator.mutually_exclusive(fields, ["fiscal_year", "start_date", "end_date"])

    def test_mutually_exclusive_multiple_provided(self) -> None:
        """Test with multiple fields provided."""
        fields = {"fiscal_year": 2024, "start_date": "2024-01-01"}

        with pytest.raises(ValidationError) as exc_info:
            Validator.mutually_exclusive(
                fields, ["fiscal_year", "start_date", "end_date"]
            )

        assert "mutually exclusive" in str(exc_info.value)


class TestValidatorRequires:
    """Test Validator.requires method."""

    def test_requires_both_provided(self) -> None:
        """Test with both fields provided."""
        fields = {"start_date": "2024-01-01", "end_date": "2024-12-31"}
        Validator.requires(fields, "start_date", "end_date")

    def test_requires_neither_provided(self) -> None:
        """Test with neither field provided."""
        fields = {"other": "value"}
        Validator.requires(fields, "start_date", "end_date")

    def test_requires_missing_required(self) -> None:
        """Test with required field missing."""
        fields = {"start_date": "2024-01-01"}

        with pytest.raises(ValidationError) as exc_info:
            Validator.requires(fields, "start_date", "end_date")

        assert "is required when" in str(exc_info.value)
        assert exc_info.value.field == "end_date"


class TestValidatorCustom:
    """Test Validator.custom method."""

    def test_custom_valid(self) -> None:
        """Test custom validator with valid value."""
        Validator.custom(
            10, "age", lambda x: x > 0 and x < 150, "Age must be between 1 and 149"
        )

    def test_custom_none(self) -> None:
        """Test custom validator with None."""
        Validator.custom(None, "age", lambda x: x > 0, "Age must be positive")

    def test_custom_invalid(self) -> None:
        """Test custom validator with invalid value."""
        with pytest.raises(ValidationError) as exc_info:
            Validator.custom(
                200, "age", lambda x: x > 0 and x < 150, "Age must be between 1 and 149"
            )

        assert "Age must be between 1 and 149" in str(exc_info.value)


class TestSanitizeString:
    """Test sanitize_string function."""

    def test_sanitize_string_none(self) -> None:
        """Test with None."""
        assert sanitize_string(None) is None

    def test_sanitize_string_trim_whitespace(self) -> None:
        """Test trimming whitespace."""
        assert sanitize_string("  hello  ") == "hello"

    def test_sanitize_string_max_length(self) -> None:
        """Test maximum length limiting."""
        assert sanitize_string("hello world", max_length=5) == "hello"

    def test_sanitize_string_no_max_length(self) -> None:
        """Test without maximum length."""
        assert sanitize_string("hello world") == "hello world"


class TestNormalizeCase:
    """Test normalize_case function."""

    def test_normalize_case_none(self) -> None:
        """Test with None."""
        assert normalize_case(None) is None

    def test_normalize_case_lower(self) -> None:
        """Test lowercase normalization."""
        assert normalize_case("HELLO World", "lower") == "hello world"

    def test_normalize_case_upper(self) -> None:
        """Test uppercase normalization."""
        assert normalize_case("hello World", "upper") == "HELLO WORLD"

    def test_normalize_case_title(self) -> None:
        """Test title case normalization."""
        assert normalize_case("hello world", "title") == "Hello World"

    def test_normalize_case_invalid_mode(self) -> None:
        """Test with invalid mode."""
        assert normalize_case("hello", "invalid") == "hello"


class TestCoerceToInt:
    """Test coerce_to_int function."""

    def test_coerce_to_int_none(self) -> None:
        """Test with None."""
        assert coerce_to_int(None, "field") is None

    def test_coerce_to_int_none_with_default(self) -> None:
        """Test with None and default."""
        assert coerce_to_int(None, "field", default=10) == 10

    def test_coerce_to_int_already_int(self) -> None:
        """Test with integer value."""
        assert coerce_to_int(42, "field") == 42

    def test_coerce_to_int_from_string(self) -> None:
        """Test coercion from string."""
        assert coerce_to_int("42", "field") == 42

    def test_coerce_to_int_invalid_string(self) -> None:
        """Test with invalid string."""
        with pytest.raises(ValidationError) as exc_info:
            coerce_to_int("invalid", "field")

        assert "Cannot convert" in str(exc_info.value)

    def test_coerce_to_int_invalid_string_with_default(self) -> None:
        """Test with invalid string and default."""
        assert coerce_to_int("invalid", "field", default=10) == 10

    def test_coerce_to_int_invalid_type(self) -> None:
        """Test with invalid type."""
        with pytest.raises(ValidationError) as exc_info:
            coerce_to_int([1, 2, 3], "field")

        assert "must be an integer" in str(exc_info.value)

    def test_coerce_to_int_invalid_type_with_default(self) -> None:
        """Test with invalid type and default."""
        assert coerce_to_int([1, 2, 3], "field", default=10) == 10
