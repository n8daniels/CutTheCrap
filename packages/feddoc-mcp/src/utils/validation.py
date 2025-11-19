"""
Enhanced input validation utilities for MCP tools.

Provides validation helpers with clear error messages, input sanitization,
and actionable guidance for fixing validation errors.
"""

from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass
import re


@dataclass
class ValidationError(Exception):
    """
    Validation error with detailed context and hints.

    Provides structured error information to help users fix invalid inputs.
    """

    field: str
    """The field that failed validation"""

    value: Any
    """The invalid value"""

    message: str
    """Human-readable error message"""

    hint: Optional[str] = None
    """Optional hint for fixing the error"""

    valid_values: Optional[List[Any]] = None
    """Optional list of valid values"""

    def __str__(self) -> str:
        """Format error message with context."""
        parts = [f"Validation error for '{self.field}': {self.message}"]

        if self.value is not None:
            parts.append(f"Received: {self.value}")

        if self.hint:
            parts.append(f"Hint: {self.hint}")

        if self.valid_values:
            parts.append(f"Valid values: {', '.join(map(str, self.valid_values))}")

        return "\n".join(parts)


class Validator:
    """Enhanced validator with detailed error messages."""

    @staticmethod
    def required(value: Any, field: str, hint: Optional[str] = None) -> None:
        """
        Validate that a required field is present and not empty.

        Args:
            value: The value to validate
            field: The field name
            hint: Optional hint for fixing the error

        Raises:
            ValidationError: If value is None or empty string
        """
        if value is None or value == "":
            raise ValidationError(
                field=field,
                value=value,
                message=f"Required field '{field}' is missing or empty",
                hint=hint or f"Please provide a value for '{field}'",
            )

    @staticmethod
    def string_not_empty(
        value: Optional[str], field: str, hint: Optional[str] = None
    ) -> None:
        """
        Validate that a string is not empty or whitespace-only.

        Args:
            value: The string to validate
            field: The field name
            hint: Optional hint for fixing the error

        Raises:
            ValidationError: If string is empty or whitespace-only
        """
        if value is not None and isinstance(value, str) and not value.strip():
            raise ValidationError(
                field=field,
                value=value,
                message=f"Field '{field}' cannot be empty or whitespace",
                hint=hint or f"Please provide a non-empty value for '{field}'",
            )

    @staticmethod
    def integer_range(
        value: Optional[int],
        field: str,
        min_value: Optional[int] = None,
        max_value: Optional[int] = None,
        hint: Optional[str] = None,
    ) -> None:
        """
        Validate that an integer is within a specified range.

        Args:
            value: The integer to validate
            field: The field name
            min_value: Minimum allowed value (inclusive)
            max_value: Maximum allowed value (inclusive)
            hint: Optional hint for fixing the error

        Raises:
            ValidationError: If value is outside the valid range
        """
        if value is None:
            return

        if not isinstance(value, int):
            raise ValidationError(
                field=field,
                value=value,
                message=f"Field '{field}' must be an integer",
                hint=hint or f"Please provide an integer value for '{field}'",
            )

        if min_value is not None and value < min_value:
            raise ValidationError(
                field=field,
                value=value,
                message=f"Field '{field}' must be >= {min_value}",
                hint=hint or f"Minimum value is {min_value}",
            )

        if max_value is not None and value > max_value:
            raise ValidationError(
                field=field,
                value=value,
                message=f"Field '{field}' must be <= {max_value}",
                hint=hint or f"Maximum value is {max_value}",
            )

    @staticmethod
    def one_of(
        value: Optional[Any],
        field: str,
        valid_values: List[Any],
        case_sensitive: bool = True,
        hint: Optional[str] = None,
    ) -> None:
        """
        Validate that a value is one of the allowed values.

        Args:
            value: The value to validate
            field: The field name
            valid_values: List of valid values
            case_sensitive: Whether string comparison is case-sensitive
            hint: Optional hint for fixing the error

        Raises:
            ValidationError: If value is not in valid_values
        """
        if value is None:
            return

        # Case-insensitive comparison for strings
        if not case_sensitive and isinstance(value, str):
            value_lower = value.lower()
            valid_values_lower = [
                v.lower() if isinstance(v, str) else v for v in valid_values
            ]
            if value_lower not in valid_values_lower:
                raise ValidationError(
                    field=field,
                    value=value,
                    message=f"Invalid value for '{field}'",
                    hint=hint,
                    valid_values=valid_values,
                )
        else:
            if value not in valid_values:
                raise ValidationError(
                    field=field,
                    value=value,
                    message=f"Invalid value for '{field}'",
                    hint=hint,
                    valid_values=valid_values,
                )

    @staticmethod
    def pattern(
        value: Optional[str],
        field: str,
        pattern: str,
        description: str,
        hint: Optional[str] = None,
    ) -> None:
        """
        Validate that a string matches a regex pattern.

        Args:
            value: The string to validate
            field: The field name
            pattern: Regular expression pattern
            description: Human-readable description of the pattern
            hint: Optional hint for fixing the error

        Raises:
            ValidationError: If string doesn't match pattern
        """
        if value is None:
            return

        if not isinstance(value, str):
            raise ValidationError(
                field=field,
                value=value,
                message=f"Field '{field}' must be a string",
                hint=hint,
            )

        if not re.match(pattern, value):
            raise ValidationError(
                field=field,
                value=value,
                message=f"Field '{field}' must match pattern: {description}",
                hint=hint or f"Expected format: {description}",
            )

    @staticmethod
    def mutually_exclusive(
        fields: Dict[str, Any], field_names: List[str], hint: Optional[str] = None
    ) -> None:
        """
        Validate that only one of the specified fields is provided.

        Args:
            fields: Dictionary of all fields
            field_names: List of mutually exclusive field names
            hint: Optional hint for fixing the error

        Raises:
            ValidationError: If more than one field is provided
        """
        provided = [name for name in field_names if fields.get(name) is not None]

        if len(provided) > 1:
            raise ValidationError(
                field=", ".join(provided),
                value=None,
                message=f"Fields {', '.join(field_names)} are mutually exclusive",
                hint=hint or f"Please provide only one of: {', '.join(field_names)}",
            )

    @staticmethod
    def requires(
        fields: Dict[str, Any],
        field: str,
        required_field: str,
        hint: Optional[str] = None,
    ) -> None:
        """
        Validate that if one field is provided, another is required.

        Args:
            fields: Dictionary of all fields
            field: The field that triggers the requirement
            required_field: The field that is required
            hint: Optional hint for fixing the error

        Raises:
            ValidationError: If field is provided but required_field is not
        """
        if fields.get(field) is not None and fields.get(required_field) is None:
            raise ValidationError(
                field=required_field,
                value=None,
                message=f"Field '{required_field}' is required when '{field}' is provided",
                hint=hint or f"Please provide '{required_field}' along with '{field}'",
            )

    @staticmethod
    def custom(
        value: Any,
        field: str,
        validator_func: Callable[[Any], bool],
        message: str,
        hint: Optional[str] = None,
    ) -> None:
        """
        Validate using a custom validation function.

        Args:
            value: The value to validate
            field: The field name
            validator_func: Function that returns True if valid
            message: Error message if validation fails
            hint: Optional hint for fixing the error

        Raises:
            ValidationError: If validator_func returns False
        """
        if value is None:
            return

        if not validator_func(value):
            raise ValidationError(field=field, value=value, message=message, hint=hint)


def sanitize_string(
    value: Optional[str], max_length: Optional[int] = None
) -> Optional[str]:
    """
    Sanitize a string by trimming whitespace and limiting length.

    Args:
        value: The string to sanitize
        max_length: Maximum allowed length (None = no limit)

    Returns:
        Sanitized string or None if input is None
    """
    if value is None:
        return None

    # Trim whitespace
    sanitized = value.strip()

    # Limit length
    if max_length is not None and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized


def normalize_case(value: Optional[str], mode: str = "lower") -> Optional[str]:
    """
    Normalize string case.

    Args:
        value: The string to normalize
        mode: Normalization mode ("lower", "upper", "title")

    Returns:
        Normalized string or None if input is None
    """
    if value is None:
        return None

    if mode == "lower":
        return value.lower()
    elif mode == "upper":
        return value.upper()
    elif mode == "title":
        return value.title()
    else:
        return value


def coerce_to_int(
    value: Any, field: str, default: Optional[int] = None
) -> Optional[int]:
    """
    Coerce a value to integer with error handling.

    Args:
        value: The value to coerce
        field: The field name (for error messages)
        default: Default value if coercion fails

    Returns:
        Integer value or default

    Raises:
        ValidationError: If coercion fails and no default provided
    """
    if value is None:
        return default

    if isinstance(value, int):
        return value

    if isinstance(value, str):
        try:
            return int(value)
        except ValueError:
            if default is not None:
                return default
            raise ValidationError(
                field=field,
                value=value,
                message=f"Cannot convert '{field}' to integer",
                hint=f"Please provide a valid integer for '{field}'",
            )

    if default is not None:
        return default

    raise ValidationError(
        field=field,
        value=value,
        message=f"Field '{field}' must be an integer",
        hint=f"Please provide a valid integer for '{field}'",
    )
