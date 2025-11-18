"""
Metrics Tracker
Collects and analyzes performance metrics from RAG systems.
"""

from typing import Dict, List
import time
import json


class MetricsTracker:
    """
    Tracks performance metrics for RAG system comparison.

    Metrics tracked:
    - API calls made
    - Documents loaded
    - Chunks created
    - Query time
    - Fetch time
    - Cache hit rate
    """

    def __init__(self, system_name: str):
        self.system_name = system_name
        self.sessions = []
        self.current_session = None

    def start_session(self, session_name: str = None):
        """Start a new metrics collection session."""
        self.current_session = {
            'session_name': session_name or f"session_{len(self.sessions) + 1}",
            'system': self.system_name,
            'start_time': time.time(),
            'operations': [],
            'total_metrics': {
                'api_calls': 0,
                'documents_loaded': 0,
                'chunks_created': 0,
                'queries_processed': 0,
                'total_fetch_time': 0.0,
                'total_query_time': 0.0,
            }
        }

    def record_operation(self, operation_type: str, metrics: Dict):
        """Record an individual operation."""
        if not self.current_session:
            self.start_session()

        operation = {
            'type': operation_type,
            'timestamp': time.time(),
            'metrics': metrics.copy()
        }

        self.current_session['operations'].append(operation)

        # Update totals
        for key in self.current_session['total_metrics']:
            if key in metrics:
                self.current_session['total_metrics'][key] += metrics[key]

    def end_session(self) -> Dict:
        """End current session and return summary."""
        if not self.current_session:
            return {}

        self.current_session['end_time'] = time.time()
        self.current_session['duration'] = (
            self.current_session['end_time'] - self.current_session['start_time']
        )

        session_summary = self.current_session.copy()
        self.sessions.append(session_summary)
        self.current_session = None

        return session_summary

    def get_summary(self) -> Dict:
        """Get summary of all sessions."""
        if not self.sessions:
            return {}

        total_metrics = {
            'api_calls': 0,
            'documents_loaded': 0,
            'chunks_created': 0,
            'queries_processed': 0,
            'total_fetch_time': 0.0,
            'total_query_time': 0.0,
        }

        for session in self.sessions:
            for key in total_metrics:
                total_metrics[key] += session['total_metrics'].get(key, 0)

        return {
            'system': self.system_name,
            'total_sessions': len(self.sessions),
            'total_metrics': total_metrics,
            'avg_query_time': (
                total_metrics['total_query_time'] / total_metrics['queries_processed']
                if total_metrics['queries_processed'] > 0 else 0
            ),
            'avg_fetch_time': (
                total_metrics['total_fetch_time'] / len([
                    s for s in self.sessions if s['total_metrics'].get('total_fetch_time', 0) > 0
                ])
                if any(s['total_metrics'].get('total_fetch_time', 0) > 0 for s in self.sessions)
                else 0
            )
        }

    def save(self, filepath: str):
        """Save metrics to JSON file."""
        data = {
            'system': self.system_name,
            'sessions': self.sessions,
            'summary': self.get_summary()
        }

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    def load(self, filepath: str):
        """Load metrics from JSON file."""
        with open(filepath, 'r') as f:
            data = json.load(f)

        self.system_name = data['system']
        self.sessions = data['sessions']
