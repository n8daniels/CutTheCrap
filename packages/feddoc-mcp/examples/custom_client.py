#!/usr/bin/env python
"""
Custom Client Example for FedDocMCP

This example shows how to use FedDocMCP as a library in your own
Python application to build custom tools and workflows.

Use cases:
- Build a custom legislative tracking dashboard
- Create automated bill monitoring alerts
- Integrate Congressional data into your application
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add src to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "src"))

from dotenv import load_dotenv
from clients.congress_api import CongressAPIClient


class LegislativeTracker:
    """
    Custom client that tracks specific bills and sends notifications.

    This demonstrates how to build custom functionality on top of FedDocMCP.
    """

    def __init__(self, api_key: str = None):
        """Initialize the tracker."""
        self.client = CongressAPIClient(api_key=api_key)
        self.tracked_bills = []

    def track_bill(self, congress: int, bill_type: str, bill_number: int):
        """
        Add a bill to the tracking list.

        Args:
            congress: Congress number (e.g., 118)
            bill_type: Type of bill (hr, s, etc.)
            bill_number: Bill number
        """
        bill_id = {
            "congress": congress,
            "type": bill_type,
            "number": bill_number,
            "added_date": datetime.now().isoformat()
        }

        self.tracked_bills.append(bill_id)
        print(f"✓ Now tracking {bill_type.upper()} {bill_number} from {congress}th Congress")

    def get_updates(self):
        """
        Check for updates on all tracked bills.

        Returns:
            List of bills with their latest status
        """
        updates = []

        for bill in self.tracked_bills:
            try:
                # Get current bill details
                details = self.client.get_bill_details(
                    congress=bill["congress"],
                    bill_type=bill["type"],
                    bill_number=bill["number"]
                )

                # Get status
                status = self.client.get_bill_status(
                    congress=bill["congress"],
                    bill_type=bill["type"],
                    bill_number=bill["number"]
                )

                updates.append({
                    "bill": f"{bill['type'].upper()} {bill['number']}",
                    "title": details.get("title", "No title"),
                    "status": status.get("status", "Unknown"),
                    "latest_action": status.get("actions", [{}])[0].get("text", "No recent action"),
                    "latest_action_date": status.get("actions", [{}])[0].get("date", "N/A")
                })

            except Exception as e:
                print(f"Error getting updates for {bill['type']} {bill['number']}: {e}")

        return updates

    def print_summary(self):
        """Print a summary of all tracked bills."""
        print("\n" + "=" * 70)
        print("LEGISLATIVE TRACKER SUMMARY")
        print("=" * 70 + "\n")

        updates = self.get_updates()

        for i, update in enumerate(updates, 1):
            print(f"{i}. {update['bill']}: {update['title'][:60]}...")
            print(f"   Status: {update['status']}")
            print(f"   Latest Action ({update['latest_action_date']}):")
            print(f"   {update['latest_action'][:100]}...")
            print()


class TopicMonitor:
    """
    Monitor bills on specific topics.

    This demonstrates how to create topic-based alerts.
    """

    def __init__(self, api_key: str = None):
        """Initialize the monitor."""
        self.client = CongressAPIClient(api_key=api_key)
        self.topics = {}

    def add_topic(self, topic_name: str, keywords: list):
        """
        Add a topic to monitor.

        Args:
            topic_name: Name of the topic (e.g., "Climate Change")
            keywords: List of keywords to search for
        """
        self.topics[topic_name] = keywords
        print(f"✓ Now monitoring topic: {topic_name}")

    def check_new_bills(self, congress: int = 118):
        """
        Check for new bills on monitored topics.

        Args:
            congress: Congress number to search

        Returns:
            Dictionary of topics with new bills
        """
        results = {}

        for topic_name, keywords in self.topics.items():
            print(f"\nSearching for bills about '{topic_name}'...")

            topic_bills = []

            for keyword in keywords:
                try:
                    bills = self.client.search_bills(
                        query=keyword,
                        congress=congress,
                        limit=5
                    )

                    for bill in bills:
                        # Avoid duplicates
                        bill_id = f"{bill.get('type')}{bill.get('number')}"
                        if not any(b.get("id") == bill_id for b in topic_bills):
                            bill["id"] = bill_id
                            topic_bills.append(bill)

                except Exception as e:
                    print(f"Error searching '{keyword}': {e}")

            results[topic_name] = topic_bills

        return results

    def print_report(self, congress: int = 118):
        """Print a topic monitoring report."""
        print("\n" + "=" * 70)
        print(f"TOPIC MONITORING REPORT - {congress}th Congress")
        print("=" * 70 + "\n")

        results = self.check_new_bills(congress)

        for topic_name, bills in results.items():
            print(f"\n{topic_name.upper()}")
            print("-" * 70)

            if bills:
                for i, bill in enumerate(bills[:5], 1):  # Top 5
                    print(f"{i}. {bill.get('type', '').upper()} {bill.get('number', 'N/A')}")
                    print(f"   {bill.get('title', 'No title')[:80]}...")
                    print()
            else:
                print("No bills found for this topic.\n")


def example_1_bill_tracker():
    """Example 1: Track specific bills."""
    print("\n" + "=" * 70)
    print("EXAMPLE 1: Legislative Tracker")
    print("=" * 70)

    # Create tracker
    tracker = LegislativeTracker()

    # Add bills to track
    tracker.track_bill(congress=118, bill_type="hr", bill_number=1)
    tracker.track_bill(congress=118, bill_type="s", bill_number=1)
    tracker.track_bill(congress=118, bill_type="hr", bill_number=2)

    # Get summary
    tracker.print_summary()


def example_2_topic_monitor():
    """Example 2: Monitor topics."""
    print("\n" + "=" * 70)
    print("EXAMPLE 2: Topic Monitor")
    print("=" * 70)

    # Create monitor
    monitor = TopicMonitor()

    # Add topics with keywords
    monitor.add_topic("Climate & Environment", [
        "climate change",
        "renewable energy",
        "carbon emissions"
    ])

    monitor.add_topic("Technology", [
        "artificial intelligence",
        "cybersecurity",
        "data privacy"
    ])

    # Get report
    monitor.print_report(congress=118)


def main():
    """Run custom client examples."""
    # Load environment
    load_dotenv()

    # Check API key
    if not os.getenv("CONGRESS_API_KEY"):
        print("Error: CONGRESS_API_KEY not found")
        print("Please create a .env file with your API key")
        return

    print("\n" + "=" * 70)
    print("FedDocMCP - Custom Client Examples")
    print("=" * 70)

    try:
        # Run examples
        example_1_bill_tracker()

        input("\nPress Enter to continue to Example 2...")

        example_2_topic_monitor()

        print("\n" + "=" * 70)
        print("Examples completed!")
        print("\nThese examples show how you can build custom applications")
        print("using FedDocMCP as a library.")
        print("=" * 70)

    except Exception as e:
        print(f"\nError: {e}")
        print("\nSee docs/TROUBLESHOOTING.md for help")


if __name__ == "__main__":
    main()
