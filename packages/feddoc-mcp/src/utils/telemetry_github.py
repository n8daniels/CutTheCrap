"""
GitHub-based telemetry system - uses GitHub as a database.

Metrics are stored as JSON files in the repo, updated via GitHub API.
Completely free, no external services needed.
"""

import os
import logging
import json
from datetime import datetime
from typing import Dict, Any
import asyncio

logger = logging.getLogger(__name__)


class GitHubTelemetryClient:
    """
    Store telemetry metrics as JSON files in GitHub repository.

    Uses GitHub API to commit metrics data to a separate branch.
    Frontend reads JSON files directly from GitHub Pages.
    """

    def __init__(self):
        """Initialize GitHub telemetry client."""
        self.enabled = os.getenv("TELEMETRY_ENABLED", "true").lower() != "false"
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.repo = os.getenv("GITHUB_REPO", "n8daniels/FedDocMCP")
        self.branch = os.getenv("TELEMETRY_BRANCH", "telemetry-data")

        if not self.github_token:
            logger.warning("GITHUB_TOKEN not set. Telemetry disabled.")
            self.enabled = False

    async def send_metrics(self, metrics: Dict[str, Any]):
        """
        Send metrics by committing to GitHub repository.

        Args:
            metrics: Metrics dictionary to store
        """
        if not self.enabled:
            return

        try:
            # Prepare data
            date = datetime.utcnow().strftime("%Y-%m-%d")
            filename = f"metrics/{date}.json"

            # Read existing data for today
            existing_data = await self._read_file(filename) or []

            # Append new metrics
            metrics["timestamp"] = datetime.utcnow().isoformat()
            existing_data.append(metrics)

            # Write back
            await self._write_file(filename, existing_data)

            logger.info(f"Telemetry committed to GitHub: {filename}")

        except Exception as e:
            logger.error(f"Failed to send GitHub telemetry: {e}")

    async def _read_file(self, path: str):
        """Read file from GitHub."""
        try:
            import aiohttp

            url = f"https://api.github.com/repos/{self.repo}/contents/{path}"
            headers = {
                "Authorization": f"token {self.github_token}",
                "Accept": "application/vnd.github.v3+json"
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params={"ref": self.branch}) as resp:
                    if resp.status == 404:
                        return None

                    data = await resp.json()
                    import base64
                    content = base64.b64decode(data['content']).decode('utf-8')
                    return json.loads(content)

        except Exception as e:
            logger.debug(f"Could not read {path}: {e}")
            return None

    async def _write_file(self, path: str, data: Any):
        """Write file to GitHub via API."""
        import aiohttp
        import base64

        url = f"https://api.github.com/repos/{self.repo}/contents/{path}"
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }

        # Get current file SHA if it exists
        sha = None
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params={"ref": self.branch}) as resp:
                    if resp.status == 200:
                        existing = await resp.json()
                        sha = existing.get('sha')
        except:
            pass

        # Prepare commit
        content = json.dumps(data, indent=2)
        content_bytes = content.encode('utf-8')
        content_b64 = base64.b64encode(content_bytes).decode('utf-8')

        payload = {
            "message": f"Update telemetry: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            "content": content_b64,
            "branch": self.branch
        }

        if sha:
            payload["sha"] = sha

        # Commit
        async with aiohttp.ClientSession() as session:
            async with session.put(url, headers=headers, json=payload) as resp:
                if resp.status not in (200, 201):
                    error = await resp.text()
                    raise Exception(f"GitHub API error: {error}")
