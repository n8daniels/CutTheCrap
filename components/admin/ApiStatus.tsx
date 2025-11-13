'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DatabaseStats {
  bills: number;
  sections: number;
  votes: number;
  perspectives: number;
  users: number;
  cacheEntries: number;
  auditLogs: number;
}

interface SystemHealth {
  supabase: 'healthy' | 'degraded' | 'down';
  ollama: 'healthy' | 'degraded' | 'down';
  cache: 'healthy' | 'degraded' | 'down';
}

interface AdminStats {
  database: DatabaseStats;
  health: SystemHealth;
  timestamp: string;
}

export default function ApiStatus() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchStats() {
    try {
      setError(null);
      const response = await fetch('/api/admin/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dem-blue mx-auto mb-4"></div>
          <p className="text-text-muted">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button onClick={fetchStats} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getHealthColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
        return 'text-red-600 bg-red-100';
    }
  };

  const getHealthIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'down':
        return '✗';
    }
  };

  const totalDbSize = stats.database.bills + stats.database.sections +
                      stats.database.votes + stats.database.perspectives +
                      stats.database.users + stats.database.cacheEntries +
                      stats.database.auditLogs;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Status</h2>
          <p className="text-sm text-text-muted">
            Last updated: {new Date(stats.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={fetchStats}
            className="btn-secondary"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Service Health</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-bg-secondary">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Supabase</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getHealthColor(stats.health.supabase)}`}>
                {getHealthIcon(stats.health.supabase)} {stats.health.supabase}
              </span>
            </div>
            <p className="text-xs text-text-muted">Database & API</p>
          </div>

          <div className="p-4 rounded-lg bg-bg-secondary">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Ollama LLM</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getHealthColor(stats.health.ollama)}`}>
                {getHealthIcon(stats.health.ollama)} {stats.health.ollama}
              </span>
            </div>
            <p className="text-xs text-text-muted">Local AI Analysis</p>
          </div>

          <div className="p-4 rounded-lg bg-bg-secondary">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Cache</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getHealthColor(stats.health.cache)}`}>
                {getHealthIcon(stats.health.cache)} {stats.health.cache}
              </span>
            </div>
            <p className="text-xs text-text-muted">Content Caching</p>
          </div>
        </div>
      </div>

      {/* Database Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Database Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-bg-secondary">
            <div className="text-3xl font-bold text-dem-blue">{totalDbSize.toLocaleString()}</div>
            <div className="text-sm text-text-muted mt-1">Total Rows</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-bg-secondary">
            <div className="text-3xl font-bold text-text-primary">{stats.database.bills.toLocaleString()}</div>
            <div className="text-sm text-text-muted mt-1">Bills</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-bg-secondary">
            <div className="text-3xl font-bold text-text-primary">{stats.database.sections.toLocaleString()}</div>
            <div className="text-sm text-text-muted mt-1">Sections</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-bg-secondary">
            <div className="text-3xl font-bold text-text-primary">{stats.database.users.toLocaleString()}</div>
            <div className="text-sm text-text-muted mt-1">Users</div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Content Statistics */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Content Statistics</h3>
          <div className="space-y-3">
            <StatRow label="Bills" value={stats.database.bills} />
            <StatRow label="Bill Sections" value={stats.database.sections} />
            <StatRow label="Votes" value={stats.database.votes} />
            <StatRow label="Partisan Perspectives" value={stats.database.perspectives} />
          </div>
        </div>

        {/* System Statistics */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">System Statistics</h3>
          <div className="space-y-3">
            <StatRow label="Users" value={stats.database.users} />
            <StatRow label="Cache Entries" value={stats.database.cacheEntries} />
            <StatRow label="Audit Logs" value={stats.database.auditLogs} />
          </div>
        </div>
      </div>

      {/* Cache Performance */}
      {stats.database.cacheEntries > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Cache Performance</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-700">{stats.database.cacheEntries}</div>
              <div className="text-sm text-green-600 mt-1">Cached Analyses</div>
              <div className="text-xs text-text-muted mt-2">
                Reducing API calls to LLM
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-700">
                {stats.database.sections > 0
                  ? Math.round((stats.database.cacheEntries / stats.database.sections) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-blue-600 mt-1">Cache Hit Potential</div>
              <div className="text-xs text-text-muted mt-2">
                Sections with cached content
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-700">
                {(stats.database.cacheEntries * 0.5).toFixed(1)} MB
              </div>
              <div className="text-sm text-purple-600 mt-1">Est. Cache Size</div>
              <div className="text-xs text-text-muted mt-2">
                Approximate storage used
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-text-secondary">{label}</span>
      <span className="font-semibold text-lg">{value.toLocaleString()}</span>
    </div>
  );
}
