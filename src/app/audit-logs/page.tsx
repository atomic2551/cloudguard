'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, AuditLogDto } from '@/lib/api';

const actionColors: Record<string, string> = {
  USER_LOGIN: 'text-blue-400',
  USER_LOGIN_FAILED: 'text-red-400',
  USER_CREATED: 'text-green-400',
  ALERT_STATUS_CHANGED: 'text-yellow-400',
  ALERT_COMMENT_ADDED: 'text-cyan-400',
  INCIDENT_CREATED: 'text-orange-400',
  IAM_USER_DISABLED: 'text-red-400',
  DETECTION_RULE_TOGGLED: 'text-purple-400',
  CLOUD_ACCOUNT_ADDED: 'text-teal-400',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterResult, setFilterResult] = useState('ALL');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.audit.list({
        page: 1,
        size: 50,
        search: debouncedSearch || undefined,
      });
      setLogs(res.items || []);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to fetch platform audit trail from server.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchAction = filterAction === 'ALL' || log.action === filterAction;
      const matchResult = filterResult === 'ALL' || log.result === filterResult;
      return matchAction && matchResult;
    });
  }, [logs, filterAction, filterResult]);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const stats = useMemo(() => {
    return {
      total: totalElements,
      successful: logs.filter((l) => l.result === 'SUCCESS').length,
      failed: logs.filter((l) => l.result === 'FAILURE').length,
      users: new Set(logs.map((l) => l.userDisplayName)).size,
    };
  }, [logs, totalElements]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Append-Only Audit Logs</h1>
            <p className="text-gray-500 text-sm mt-0.5">Immutable audit trail of all platform activities and access events</p>
          </div>
          <button
            onClick={loadAuditLogs}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: stats.total, color: 'text-gray-300' },
            { label: 'Successful Operations', value: stats.successful, color: 'text-green-400' },
            { label: 'Security Failures', value: stats.failed, color: 'text-red-400' },
            { label: 'Active Principals', value: stats.users, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search audit trail by user, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none"
          >
            <option value="ALL">All Results</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} events</span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={loadAuditLogs} className="underline hover:text-red-300">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36">Timestamp</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-40">User / Actor</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Action</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Target Resource</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-32">Source IP</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-36 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-800 rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-600">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No audit logs matching query</div>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className={`hover:bg-gray-800/30 transition-colors ${log.result === 'FAILURE' ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="text-gray-400 text-xs font-mono">
                        {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-200 text-sm font-medium">{log.userDisplayName || 'System'}</div>
                      <div className="text-gray-500 text-xs">{log.userId ? log.userId.slice(0, 8) : 'automated'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${actionColors[log.action] ?? 'text-gray-300'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </div>
                      {log.details && (
                        <div className="text-gray-500 text-xs mt-0.5 font-mono truncate max-w-[280px]">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-gray-400 text-xs font-mono">{log.resourceId || 'N/A'}</div>
                      <div className="text-gray-600 text-xs">{log.resourceType}</div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-mono ${log.ipAddress ? 'text-gray-400' : 'text-gray-600'}`}>
                        {log.ipAddress || '127.0.0.1'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.result} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
