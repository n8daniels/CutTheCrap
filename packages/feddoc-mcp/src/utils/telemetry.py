"""
Telemetry system for sending usage analytics to Firebase.

Privacy-first: Only aggregated, anonymous metrics are sent.
Users can disable by setting TELEMETRY_ENABLED=false in environment.
"""

import os
import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class TelemetryClient:
    """Send anonymous usage metrics to Firebase for public analytics dashboard."""

    def __init__(self, enabled: bool = True):
        """
        Initialize telemetry client.

        Args:
            enabled: Whether telemetry is enabled (default: True, respects TELEMETRY_ENABLED env var)
        """
        self.enabled = enabled and os.getenv("TELEMETRY_ENABLED", "true").lower() != "false"
        self.firebase_client: Optional[Any] = None

        if self.enabled:
            self._init_firebase()
        else:
            logger.info("Telemetry disabled")

    def _init_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            import firebase_admin
            from firebase_admin import credentials, db

            # Check if Firebase credentials exist
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            if not cred_path or not os.path.exists(cred_path):
                logger.warning(
                    "Firebase credentials not found. Telemetry disabled. "
                    "Set FIREBASE_CREDENTIALS_PATH to enable analytics."
                )
                self.enabled = False
                return

            # Initialize Firebase
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(
                cred,
                {
                    "databaseURL": os.getenv(
                        "FIREBASE_DATABASE_URL",
                        "https://feddocmcp-default-rtdb.firebaseio.com",
                    )
                },
            )
            self.firebase_client = db
            logger.info("Telemetry enabled - sending anonymous usage metrics")

        except ImportError:
            logger.warning("firebase-admin not installed. Telemetry disabled.")
            self.enabled = False
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            self.enabled = False

    async def send_metrics(self, metrics: Dict[str, Any]):
        """
        Send aggregated metrics to Firebase.

        Args:
            metrics: Dictionary of metric name -> value

        Privacy: Only sends aggregated, anonymous metrics:
        - Cache hit rate
        - Average response time
        - Tool usage counts
        - API call counts
        - Error rates
        Does NOT send: user data, queries, bill content, or identifying information
        """
        if not self.enabled or not self.firebase_client:
            return

        try:
            # Add timestamp
            metrics["timestamp"] = datetime.utcnow().isoformat()
            metrics["date"] = datetime.utcnow().strftime("%Y-%m-%d")

            # Send to Firebase (async to not block MCP server)
            ref = self.firebase_client.reference("metrics")
            await asyncio.to_thread(ref.push, metrics)

            logger.debug(f"Telemetry sent: {json.dumps(metrics, indent=2)}")

        except Exception as e:
            # Never fail the MCP server due to telemetry errors
            logger.error(f"Failed to send telemetry: {e}")

    async def send_daily_summary(self, metrics_obj):
        """
        Send daily summary of server metrics.

        Args:
            metrics_obj: PerformanceMetrics instance
        """
        if not self.enabled:
            return

        summary = {
            "type": "daily_summary",
            "cache_hit_rate": round(metrics_obj.get_cache_hit_rate(), 2),
            "avg_response_time_ms": round(metrics_obj.get_avg_response_time(), 2),
            "total_requests": metrics_obj.total_requests,
            "total_api_calls": metrics_obj.get_total_api_calls(),
            "error_count": metrics_obj.error_count,
            "tool_calls": dict(metrics_obj.tool_calls),
            "api_calls": dict(metrics_obj.api_calls),
        }

        await self.send_metrics(summary)


# Global telemetry instance
_telemetry_client: Optional[TelemetryClient] = None


def get_telemetry_client() -> TelemetryClient:
    """Get or create the global telemetry client."""
    global _telemetry_client
    if _telemetry_client is None:
        _telemetry_client = TelemetryClient()
    return _telemetry_client
