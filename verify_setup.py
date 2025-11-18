#!/usr/bin/env python3
"""
Setup Verification Script
Checks that all files and directories are in place.
Run this before installing dependencies.
"""

import os
import sys


def check_exists(path, item_type="file"):
    """Check if a file or directory exists."""
    exists = os.path.exists(path)
    status = "✓" if exists else "✗"
    print(f"  {status} {path}")
    return exists


def main():
    """Verify project structure."""
    print("\n" + "=" * 60)
    print("RAG SYSTEM SETUP VERIFICATION")
    print("=" * 60)

    all_good = True

    # Check directories
    print("\n### Directories ###")
    dirs = [
        "src",
        "src/rag",
        "src/rag/shared",
        "src/rag/without_mcp",
        "src/rag/with_mcp",
        "src/analysis",
        "src/demo",
        "data",
        "data/sample_documents",
    ]

    for d in dirs:
        if not check_exists(d, "directory"):
            all_good = False

    # Check key files
    print("\n### Core RAG Components ###")
    files = [
        "src/rag/shared/chunker.py",
        "src/rag/shared/embeddings.py",
        "src/rag/shared/vector_store.py",
        "src/rag/without_mcp/document_loader.py",
        "src/rag/without_mcp/rag_system.py",
        "src/rag/with_mcp/mcp_document_loader.py",
        "src/rag/with_mcp/rag_system.py",
    ]

    for f in files:
        if not check_exists(f):
            all_good = False

    # Check analysis components
    print("\n### Analysis & Comparison ###")
    analysis_files = [
        "src/analysis/metrics_tracker.py",
        "src/analysis/comparator.py",
    ]

    for f in analysis_files:
        if not check_exists(f):
            all_good = False

    # Check demo
    print("\n### Demo & Documentation ###")
    demo_files = [
        "src/demo/side_by_side_comparison.py",
        "RAG_COMPARISON_README.md",
        "requirements.txt",
        ".env.example",
    ]

    for f in demo_files:
        if not check_exists(f):
            all_good = False

    # Check sample data
    print("\n### Sample Data ###")
    sample_docs = [
        "data/sample_documents/bill_117_hr_3684.json",
        "data/sample_documents/amendment_sa_2137.json",
        "data/sample_documents/usc_23_119.json",
        "data/sample_documents/pl_114_94.json",
    ]

    for f in sample_docs:
        if not check_exists(f):
            all_good = False

    # Summary
    print("\n" + "=" * 60)
    if all_good:
        print("✅ All files and directories are in place!")
        print("\nNext steps:")
        print("  1. Install dependencies: pip install -r requirements.txt")
        print("  2. Run the demo: python src/demo/side_by_side_comparison.py")
        print("  3. Or run tests: python test_rag_systems.py")
        return 0
    else:
        print("❌ Some files or directories are missing.")
        print("Check the output above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
