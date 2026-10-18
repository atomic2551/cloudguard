'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockAuditLogs } from '@/lib/mock-data';

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
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterResult, setFilterResult] = useState('ALL');

  const filtered = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchSearch = !search ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.resource.toLowerCase().includes(search.toLowerCase()) ||
        log.ip.includes(search);
      const matchAction = filterAction === 'ALL' || log.action === filterAction;
      const matchResult = filterResult === 'ALL' || log.result === filterResult;
      return matchSearch && matchAction && matchResult;
    });
  }, [search, filterAction, filterResult]);

  const uniqueActions = Array.from(new Set(mockAuditLogs.map(l => l.action)));

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Audit Logs</h1>
            <p className="text-gray-500 text-sm mt-0.5">Complete audit trail of all platform activities</p>
          </div>
          <button className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: mockAuditLogs.length, color: 'text-gray-300' },
            { label: 'Successful', value: mockAuditLogs.filter(l => l.result === 'SUCCESS').length, color: 'text-green-400' },
            { label: 'Failed', value: mockAuditLogs.filter(l => l.result === 'FAILURE').length, color: 'text-red-400' },
            { label: 'Unique Users', value: new Set(mockAuditLogs.map(l => l.user)).size, color: 'text-blue-400' },
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
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-500" />
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
            <option value="ALL">All Actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
            <option value="ALL">All Results</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} events</span>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36">Timestamp</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36">User</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Action</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Resource</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-32">IP Address</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((log) => (
                <tr key={log.id} className={`hover:bg-gray-800/30 transition-colors ${log.result === 'FAILURE' ? 'bg-red-500/3' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="text-gray-400 text-xs font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-gray-700 text-xs">
                      {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-300 text-sm font-medium">{log.user}</div>
                    <div className="text-gray-600 text-xs">{log.userRole}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm font-medium ${actionColors[log.action] ?? 'text-gray-300'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    {log.metadata && (
                      <div className="text-gray-600 text-xs mt-0.5">
                        {Object.entries(log.metadata).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-gray-500 text-xs font-mono">{log.resource}</div>
                    <div className="text-gray-700 text-xs">{log.resourceType}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs font-mono ${log.ip.startsWith('10.') ? 'text-gray-500' : 'text-red-400 font-medium'}`}>
                      {log.ip}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
