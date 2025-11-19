#!/usr/bin/env python
"""
Basic Usage Example for FedDocMCP

This example demonstrates how to use the CongressAPIClient directly
in your Python code, without using the MCP server.

Note: This is for demonstration purposes. Typically, you'll use FedDocMCP
through the MCP server with an MCP-compatible client.
"""

import os
import sys
from pathlib import Path

# Add src to path so we can import from it
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "src"))

from dotenv import load_dotenv
from clients.congress_api import CongressAPIClient


def example_search_bills():
    """Example: Search for bills by keyword."""
    print("=" * 60)
    print("Example 1: Search for bills about 'artificial intelligence'")
    print("=" * 60)

    # Create API client
    client = CongressAPIClient()

    # Search for bills
    results = client.search_bills(
        query="artificial intelligence",
        limit=5
    )

    print(f"\nFound {len(results)} bills:\n")

    for i, bill in enumerate(results, 1):
        print(f"{i}. {bill.get('title', 'No title')}")
        print(f"   Type: {bill.get('type', 'N/A')}")
        print(f"   Number: {bill.get('number', 'N/A')}")
        print(f"   Congress: {bill.get('congress', 'N/A')}")
        print()


def example_get_bill_details():
    """Example: Get details of a specific bill."""
    print("=" * 60)
    print("Example 2: Get details of H.R. 1 from 118th Congress")
    print("=" * 60)

    client = CongressAPIClient()

    # Get bill details
    bill = client.get_bill_details(
        congress=118,
        bill_type="hr",
        bill_number=1
    )

    print("\nBill Details:")
    print(f"Title: {bill.get('title', 'No title')}")
    print(f"Sponsor: {bill.get('sponsor', {}).get('name', 'N/A')}")
    print(f"Introduced: {bill.get('introducedDate', 'N/A')}")
    print(f"Latest Action: {bill.get('latestAction', {}).get('text', 'N/A')}")
    print()


def example_get_bill_status():
    """Example: Get status and action history of a bill."""
    print("=" * 60)
    print("Example 3: Get status of S. 1 from 118th Congress")
    print("=" * 60)

    client = CongressAPIClient()

    # Get bill status
    status = client.get_bill_status(
        congress=118,
        bill_type="s",
        bill_number=1
    )

    print("\nBill Status:")
    print(f"Current Status: {status.get('status', 'N/A')}")
    print(f"\nRecent Actions:")

    actions = status.get('actions', [])[:5]  # Show first 5 actions
    for i, action in enumerate(actions, 1):
        print(f"{i}. {action.get('date', 'N/A')}: {action.get('text', 'No description')}")
    print()


def example_filter_bills():
    """Example: Search bills with filters."""
    print("=" * 60)
    print("Example 4: Search House bills about 'infrastructure' in 117th Congress")
    print("=" * 60)

    client = CongressAPIClient()

    # Search with filters
    results = client.search_bills(
        query="infrastructure",
        congress=117,
        bill_type="hr",
        limit=5
    )

    print(f"\nFound {len(results)} House bills:\n")

    for i, bill in enumerate(results, 1):
        print(f"{i}. H.R. {bill.get('number', 'N/A')}: {bill.get('title', 'No title')[:80]}...")
        print()


def main():
    """Run all examples."""
    # Load environment variables
    load_dotenv()

    # Check API key
    if not os.getenv("CONGRESS_API_KEY"):
        print("Error: CONGRESS_API_KEY not found in environment")
        print("Please create a .env file with your API key")
        print("See .env.example for format")
        return

    print("\n" + "=" * 60)
    print("FedDocMCP - Basic Usage Examples")
    print("=" * 60 + "\n")

    try:
        # Run examples
        example_search_bills()
        input("Press Enter to continue...")

        example_get_bill_details()
        input("Press Enter to continue...")

        example_get_bill_status()
        input("Press Enter to continue...")

        example_filter_bills()

        print("=" * 60)
        print("Examples completed!")
        print("=" * 60)

    except Exception as e:
        print(f"\nError running examples: {e}")
        print("\nTroubleshooting:")
        print("1. Verify your API key is correct in .env")
        print("2. Check your internet connection")
        print("3. See docs/TROUBLESHOOTING.md for more help")


if __name__ == "__main__":
    main()
