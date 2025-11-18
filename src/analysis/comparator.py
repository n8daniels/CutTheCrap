"""
RAG System Comparator
Compares performance between traditional and MCP-enhanced RAG.
"""

from typing import Dict, List, Tuple
import json
from tabulate import tabulate


class RAGComparator:
    """
    Compares metrics between traditional RAG and MCP-enhanced RAG.

    Calculates:
    - Performance improvements
    - Cost savings
    - Efficiency gains
    """

    def __init__(self):
        self.comparisons = []

    def compare_systems(
        self,
        traditional_metrics: Dict,
        mcp_metrics: Dict,
        scenario_name: str = "Comparison"
    ) -> Dict:
        """
        Compare metrics from both systems.

        Args:
            traditional_metrics: Metrics from traditional RAG
            mcp_metrics: Metrics from MCP-enhanced RAG
            scenario_name: Name for this comparison

        Returns:
            Comparison results with improvements and savings
        """
        comparison = {
            'scenario': scenario_name,
            'traditional': traditional_metrics,
            'mcp_enhanced': mcp_metrics,
            'improvements': {},
            'savings': {}
        }

        # Calculate improvements
        if traditional_metrics.get('api_calls', 0) > 0:
            api_reduction = (
                (traditional_metrics['api_calls'] - mcp_metrics['api_calls']) /
                traditional_metrics['api_calls'] * 100
            )
            comparison['improvements']['api_calls_reduction'] = api_reduction

        if traditional_metrics.get('total_fetch_time', 0) > 0:
            time_savings = (
                (traditional_metrics['total_fetch_time'] - mcp_metrics['total_fetch_time']) /
                traditional_metrics['total_fetch_time'] * 100
            )
            comparison['improvements']['time_savings'] = time_savings

        # Calculate absolute savings
        comparison['savings'] = {
            'api_calls_saved': traditional_metrics.get('api_calls', 0) - mcp_metrics.get('api_calls', 0),
            'time_saved_seconds': traditional_metrics.get('total_fetch_time', 0) - mcp_metrics.get('total_fetch_time', 0),
        }

        # Calculate context enrichment
        comparison['enrichment'] = {
            'traditional_docs': traditional_metrics.get('documents_loaded', 0),
            'mcp_docs': mcp_metrics.get('documents_loaded', 0),
            'additional_context_docs': (
                mcp_metrics.get('documents_loaded', 0) -
                traditional_metrics.get('documents_loaded', 0)
            )
        }

        self.comparisons.append(comparison)
        return comparison

    def generate_report(self) -> str:
        """Generate a text report of all comparisons."""
        if not self.comparisons:
            return "No comparisons available."

        report = []
        report.append("=" * 80)
        report.append("RAG SYSTEM COMPARISON REPORT")
        report.append("Traditional RAG vs MCP-Enhanced RAG")
        report.append("=" * 80)
        report.append("")

        for comp in self.comparisons:
            report.append(f"\n### {comp['scenario']} ###\n")

            # Metrics table
            table_data = []

            metrics_to_show = [
                ('API Calls', 'api_calls'),
                ('Documents Loaded', 'documents_loaded'),
                ('Chunks Created', 'chunks_created'),
                ('Fetch Time (s)', 'total_fetch_time'),
                ('Queries Processed', 'queries_processed'),
            ]

            for label, key in metrics_to_show:
                trad_val = comp['traditional'].get(key, 0)
                mcp_val = comp['mcp_enhanced'].get(key, 0)
                diff = mcp_val - trad_val

                # Format difference with sign
                if isinstance(trad_val, float):
                    diff_str = f"{diff:+.2f}"
                else:
                    diff_str = f"{diff:+d}"

                table_data.append([
                    label,
                    f"{trad_val:.2f}" if isinstance(trad_val, float) else trad_val,
                    f"{mcp_val:.2f}" if isinstance(mcp_val, float) else mcp_val,
                    diff_str
                ])

            report.append(tabulate(
                table_data,
                headers=['Metric', 'Traditional', 'MCP-Enhanced', 'Difference'],
                tablefmt='grid'
            ))

            # Improvements
            report.append("\n** Key Improvements **")
            if 'api_calls_reduction' in comp['improvements']:
                report.append(
                    f"  • API Calls Reduced: {comp['improvements']['api_calls_reduction']:.1f}%"
                )
            if 'time_savings' in comp['improvements']:
                report.append(
                    f"  • Time Saved: {comp['improvements']['time_savings']:.1f}%"
                )

            # Context enrichment
            report.append("\n** Context Enrichment **")
            report.append(
                f"  • Traditional: {comp['enrichment']['traditional_docs']} documents"
            )
            report.append(
                f"  • MCP-Enhanced: {comp['enrichment']['mcp_docs']} documents"
            )
            report.append(
                f"  • Additional Context: +{comp['enrichment']['additional_context_docs']} documents"
            )

            report.append("\n" + "-" * 80 + "\n")

        return "\n".join(report)

    def get_aggregate_improvements(self) -> Dict:
        """Calculate aggregate improvements across all comparisons."""
        if not self.comparisons:
            return {}

        total_api_reduction = sum(
            c['improvements'].get('api_calls_reduction', 0)
            for c in self.comparisons
        ) / len(self.comparisons)

        total_time_savings = sum(
            c['improvements'].get('time_savings', 0)
            for c in self.comparisons
        ) / len(self.comparisons)

        total_api_saved = sum(
            c['savings']['api_calls_saved']
            for c in self.comparisons
        )

        total_time_saved = sum(
            c['savings']['time_saved_seconds']
            for c in self.comparisons
        )

        avg_context_enrichment = sum(
            c['enrichment']['additional_context_docs']
            for c in self.comparisons
        ) / len(self.comparisons)

        return {
            'avg_api_reduction_percent': total_api_reduction,
            'avg_time_savings_percent': total_time_savings,
            'total_api_calls_saved': total_api_saved,
            'total_time_saved_seconds': total_time_saved,
            'avg_additional_context_docs': avg_context_enrichment,
        }

    def save_report(self, filepath: str):
        """Save comparison report to file."""
        report = self.generate_report()

        with open(filepath, 'w') as f:
            f.write(report)

        # Also save JSON
        json_path = filepath.replace('.txt', '.json')
        with open(json_path, 'w') as f:
            json.dump({
                'comparisons': self.comparisons,
                'aggregate': self.get_aggregate_improvements()
            }, f, indent=2)

        print(f"Report saved to {filepath}")
        print(f"JSON data saved to {json_path}")
