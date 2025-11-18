"""
Visualization Module for RAG Comparison
Generates charts comparing Traditional vs MCP-Enhanced RAG performance.
"""

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from typing import Dict, List
import os


class RAGVisualizer:
    """
    Creates visualizations comparing RAG system performance.
    """

    def __init__(self, output_dir: str = "results"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        # Set style
        sns.set_style('whitegrid')
        plt.rcParams['figure.figsize'] = (12, 8)
        plt.rcParams['font.size'] = 10

    def plot_api_calls_comparison(
        self,
        traditional_metrics: Dict,
        mcp_metrics: Dict,
        save_path: str = None
    ):
        """Plot API calls comparison."""
        fig, ax = plt.subplots(figsize=(8, 6))

        data = pd.DataFrame({
            'System': ['Traditional RAG', 'MCP-Enhanced RAG'],
            'API Calls': [
                traditional_metrics.get('api_calls', 0),
                mcp_metrics.get('api_calls', 0)
            ]
        })

        bars = sns.barplot(
            data=data,
            x='System',
            y='API Calls',
            ax=ax,
            palette=['#ff6b6b', '#4ecdc4']
        )

        # Add value labels on bars
        for i, (idx, row) in enumerate(data.iterrows()):
            ax.text(
                i,
                row['API Calls'] + 0.1,
                str(row['API Calls']),
                ha='center',
                fontweight='bold',
                fontsize=14
            )

        ax.set_title('API Calls Comparison', fontsize=16, fontweight='bold', pad=20)
        ax.set_ylabel('Number of API Calls', fontsize=12)
        ax.set_xlabel('')

        # Calculate reduction
        reduction = (
            (data.iloc[0]['API Calls'] - data.iloc[1]['API Calls']) /
            data.iloc[0]['API Calls'] * 100
        )

        ax.text(
            0.5, 0.95,
            f'{reduction:.0f}% Reduction in API Calls',
            transform=ax.transAxes,
            ha='center',
            fontsize=12,
            bbox=dict(boxstyle='round', facecolor='lightgreen', alpha=0.5)
        )

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        else:
            plt.savefig(f"{self.output_dir}/api_calls_comparison.png", dpi=300, bbox_inches='tight')

        plt.close()

    def plot_context_richness(
        self,
        traditional_metrics: Dict,
        mcp_metrics: Dict,
        save_path: str = None
    ):
        """Plot context richness (documents loaded)."""
        fig, ax = plt.subplots(figsize=(8, 6))

        data = pd.DataFrame({
            'System': ['Traditional RAG', 'MCP-Enhanced RAG'],
            'Documents': [
                traditional_metrics.get('documents_loaded', 0),
                mcp_metrics.get('documents_loaded', 0)
            ]
        })

        bars = sns.barplot(
            data=data,
            x='System',
            y='Documents',
            ax=ax,
            palette=['#ff6b6b', '#4ecdc4']
        )

        # Add value labels
        for i, (idx, row) in enumerate(data.iterrows()):
            ax.text(
                i,
                row['Documents'] + 0.2,
                str(row['Documents']),
                ha='center',
                fontweight='bold',
                fontsize=14
            )

        ax.set_title('Context Richness (Documents Loaded)', fontsize=16, fontweight='bold', pad=20)
        ax.set_ylabel('Number of Documents', fontsize=12)
        ax.set_xlabel('')

        # Calculate increase
        increase = data.iloc[1]['Documents'] / data.iloc[0]['Documents']

        ax.text(
            0.5, 0.95,
            f'{increase:.1f}x More Context',
            transform=ax.transAxes,
            ha='center',
            fontsize=12,
            bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.5)
        )

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        else:
            plt.savefig(f"{self.output_dir}/context_richness.png", dpi=300, bbox_inches='tight')

        plt.close()

    def plot_comprehensive_comparison(
        self,
        traditional_metrics: Dict,
        mcp_metrics: Dict,
        save_path: str = None
    ):
        """Plot comprehensive multi-metric comparison."""
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('Comprehensive RAG System Comparison', fontsize=18, fontweight='bold', y=0.995)

        # 1. API Calls
        data_api = pd.DataFrame({
            'System': ['Traditional', 'MCP'],
            'API Calls': [
                traditional_metrics.get('api_calls', 0),
                mcp_metrics.get('api_calls', 0)
            ]
        })
        sns.barplot(data=data_api, x='System', y='API Calls', ax=axes[0, 0], palette=['#ff6b6b', '#4ecdc4'])
        axes[0, 0].set_title('API Calls', fontweight='bold')
        for i, v in enumerate(data_api['API Calls']):
            axes[0, 0].text(i, v + 0.1, str(v), ha='center', fontweight='bold')

        # 2. Documents Loaded
        data_docs = pd.DataFrame({
            'System': ['Traditional', 'MCP'],
            'Documents': [
                traditional_metrics.get('documents_loaded', 0),
                mcp_metrics.get('documents_loaded', 0)
            ]
        })
        sns.barplot(data=data_docs, x='System', y='Documents', ax=axes[0, 1], palette=['#ff6b6b', '#4ecdc4'])
        axes[0, 1].set_title('Documents Loaded', fontweight='bold')
        for i, v in enumerate(data_docs['Documents']):
            axes[0, 1].text(i, v + 0.2, str(v), ha='center', fontweight='bold')

        # 3. Chunks Created
        data_chunks = pd.DataFrame({
            'System': ['Traditional', 'MCP'],
            'Chunks': [
                traditional_metrics.get('chunks_created', 0),
                mcp_metrics.get('chunks_created', 0)
            ]
        })
        sns.barplot(data=data_chunks, x='System', y='Chunks', ax=axes[1, 0], palette=['#ff6b6b', '#4ecdc4'])
        axes[1, 0].set_title('Chunks Created', fontweight='bold')
        for i, v in enumerate(data_chunks['Chunks']):
            axes[1, 0].text(i, v + 1, str(v), ha='center', fontweight='bold')

        # 4. Queries Processed
        data_queries = pd.DataFrame({
            'System': ['Traditional', 'MCP'],
            'Queries': [
                traditional_metrics.get('queries_processed', 0),
                mcp_metrics.get('queries_processed', 0)
            ]
        })
        sns.barplot(data=data_queries, x='System', y='Queries', ax=axes[1, 1], palette=['#ff6b6b', '#4ecdc4'])
        axes[1, 1].set_title('Queries Processed', fontweight='bold')
        for i, v in enumerate(data_queries['Queries']):
            axes[1, 1].text(i, v + 0.2, str(v), ha='center', fontweight='bold')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        else:
            plt.savefig(f"{self.output_dir}/comprehensive_comparison.png", dpi=300, bbox_inches='tight')

        plt.close()

    def plot_efficiency_metrics(
        self,
        traditional_metrics: Dict,
        mcp_metrics: Dict,
        save_path: str = None
    ):
        """Plot efficiency metrics (API calls per query)."""
        fig, ax = plt.subplots(figsize=(8, 6))

        trad_queries = traditional_metrics.get('queries_processed', 1)
        mcp_queries = mcp_metrics.get('queries_processed', 1)

        trad_efficiency = traditional_metrics.get('api_calls', 0) / trad_queries
        mcp_efficiency = mcp_metrics.get('api_calls', 0) / mcp_queries

        data = pd.DataFrame({
            'System': ['Traditional RAG', 'MCP-Enhanced RAG'],
            'API Calls per Query': [trad_efficiency, mcp_efficiency]
        })

        bars = sns.barplot(
            data=data,
            x='System',
            y='API Calls per Query',
            ax=ax,
            palette=['#ff6b6b', '#4ecdc4']
        )

        # Add value labels
        for i, (idx, row) in enumerate(data.iterrows()):
            ax.text(
                i,
                row['API Calls per Query'] + 0.01,
                f"{row['API Calls per Query']:.2f}",
                ha='center',
                fontweight='bold',
                fontsize=14
            )

        ax.set_title('Efficiency: API Calls per Query', fontsize=16, fontweight='bold', pad=20)
        ax.set_ylabel('API Calls per Query (lower is better)', fontsize=12)
        ax.set_xlabel('')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        else:
            plt.savefig(f"{self.output_dir}/efficiency_metrics.png", dpi=300, bbox_inches='tight')

        plt.close()

    def generate_all_visualizations(
        self,
        traditional_metrics: Dict,
        mcp_metrics: Dict
    ):
        """Generate all visualizations."""
        print("Generating visualizations...")

        self.plot_api_calls_comparison(traditional_metrics, mcp_metrics)
        print(f"  ✓ API calls comparison saved to {self.output_dir}/api_calls_comparison.png")

        self.plot_context_richness(traditional_metrics, mcp_metrics)
        print(f"  ✓ Context richness saved to {self.output_dir}/context_richness.png")

        self.plot_comprehensive_comparison(traditional_metrics, mcp_metrics)
        print(f"  ✓ Comprehensive comparison saved to {self.output_dir}/comprehensive_comparison.png")

        self.plot_efficiency_metrics(traditional_metrics, mcp_metrics)
        print(f"  ✓ Efficiency metrics saved to {self.output_dir}/efficiency_metrics.png")

        print(f"\n✅ All visualizations saved to {self.output_dir}/")
