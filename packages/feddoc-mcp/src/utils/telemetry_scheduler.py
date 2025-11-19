"""
Scheduled telemetry reporting for FedDocMCP.

Sends anonymous usage metrics periodically to power the public analytics dashboard.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from .telemetry import get_telemetry_client

logger = logging.getLogger(__name__)


class TelemetryScheduler:
    """Schedule periodic telemetry reporting."""

    def __init__(self, monitor, interval_hours: int = 24):
        """
        Initialize telemetry scheduler.

        Args:
            monitor: PerformanceMonitor instance
            interval_hours: How often to send telemetry (default: 24 hours)
        """
        self.monitor = monitor
        self.interval = timedelta(hours=interval_hours)
        self.telemetry_client = get_telemetry_client()
        self.task: Optional[asyncio.Task] = None
        self.running = False

    async def start(self):
        """Start the telemetry scheduler."""
        if self.running:
            logger.warning("Telemetry scheduler already running")
            return

        self.running = True
        self.task = asyncio.create_task(self._run())
        logger.info(f"Telemetry scheduler started (interval: {self.interval})")

    async def stop(self):
        """Stop the telemetry scheduler."""
        if not self.running:
            return

        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

        # Send final metrics before stopping
        await self._send_metrics()
        logger.info("Telemetry scheduler stopped")

    async def _run(self):
        """Main scheduler loop."""
        try:
            while self.running:
                await asyncio.sleep(self.interval.total_seconds())
                await self._send_metrics()
        except asyncio.CancelledError:
            logger.info("Telemetry scheduler cancelled")
        except Exception as e:
            logger.error(f"Telemetry scheduler error: {e}")

    async def _send_metrics(self):
        """Send current metrics to telemetry backend."""
        try:
            await self.telemetry_client.send_daily_summary(self.monitor.metrics)
            logger.info("Telemetry metrics sent successfully")
        except Exception as e:
            logger.error(f"Failed to send telemetry metrics: {e}")


# Global scheduler instance
_scheduler: Optional[TelemetryScheduler] = None


async def start_telemetry_scheduler(monitor, interval_hours: int = 24):
    """
    Start the global telemetry scheduler.

    Args:
        monitor: PerformanceMonitor instance
        interval_hours: Reporting interval in hours
    """
    global _scheduler
    if _scheduler is None:
        _scheduler = TelemetryScheduler(monitor, interval_hours)
    await _scheduler.start()


async def stop_telemetry_scheduler():
    """Stop the global telemetry scheduler."""
    global _scheduler
    if _scheduler:
        await _scheduler.stop()
