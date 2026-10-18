'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, Search, RefreshCw, ChevronRight } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockAlerts, type Severity, type AlertStatus } from '@/lib/mock-data';

const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const statuses: AlertStatus[] = ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];

export default function AlertsPage() {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return mockAlerts.filter((a) => {
      const matchSearch = search === '' ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.sourceIp.includes(search) ||
        a.username.toLowerCase().includes(search.toLowerCase()) ||
        a.resource.toLowerCase().includes(search.toLowerCase()) ||
        a.detectionRule.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = filterSeverity === 'ALL' || a.severity === filterSeverity;
      const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
      const matchSource = filterSource === 'ALL' || a.source === filterSource;
      return matchSearch && matchSeverity && matchStatus && matchSource;
    });
  }, [search, filterSeverity, filterStatus, filterSource]);

  const counts = {
    critical: mockAlerts.filter(a => a.severity === 'CRITICAL' && a.status === 'NEW').length,
    high: mockAlerts.filter(a => a.severity === 'HIGH' && (a.status === 'NEW' || a.status === 'INVESTIGATING')).length,
    total: mockAlerts.length,
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Security Alerts</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {counts.critical} critical · {counts.high} high priority · {counts.total} total
            </p>
          </div>
          <button className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'New', count: mockAlerts.filter(a => a.status === 'NEW').length, color: 'border-blue-500/50 bg-blue-500/5 text-blue-400' },
            { label: 'Investigating', count: mockAlerts.filter(a => a.status === 'INVESTIGATING').length, color: 'border-yellow-500/50 bg-yellow-500/5 text-yellow-400' },
            { label: 'Acknowledged', count: mockAlerts.filter(a => a.status === 'ACKNOWLEDGED').length, color: 'border-purple-500/50 bg-purple-500/5 text-purple-400' },
            { label: 'Resolved', count: mockAlerts.filter(a => a.status === 'RESOLVED').length, color: 'border-green-500/50 bg-green-500/5 text-green-400' },
            { label: 'False Positive', count: mockAlerts.filter(a => a.status === 'FALSE_POSITIVE').length, color: 'border-gray-600/50 bg-gray-600/5 text-gray-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`border rounded-lg px-4 py-3 ${color}`}>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs mt-0.5 opacity-80">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            {severities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Sources</option>
            <option value="AWS_CLOUDTRAIL">CloudTrail</option>
            <option value="CONFIG_SCANNER">Config Scanner</option>
            <option value="IAM_SCANNER">IAM Scanner</option>
          </select>
          {(filterSeverity !== 'ALL' || filterStatus !== 'ALL' || filterSource !== 'ALL' || search) && (
            <button
              onClick={() => { setFilterSeverity('ALL'); setFilterStatus('ALL'); setFilterSource('ALL'); setSearch(''); }}
              className="text-blue-400 text-sm hover:underline"
            >
              Clear filters
            </button>
          )}
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} results</span>
        </div>

        {/* Alerts table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Alert</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36 hidden lg:table-cell">Source IP</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36 hidden xl:table-cell">User</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-40 hidden xl:table-cell">Detection Rule</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32 hidden md:table-cell">Time</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-600">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No alerts match your filters</div>
                  </td>
                </tr>
              ) : (
                filtered.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/alerts/${alert.id}`} className="group-hover:text-blue-400 transition-colors">
                        <div className="text-gray-200 text-sm font-medium">{alert.title}</div>
                        <div className="text-gray-600 text-xs mt-0.5 flex items-center gap-2">
                          <span>{alert.id}</span>
                          <span>·</span>
                          <span>{alert.cloudAccount}</span>
                          <span>·</span>
                          <span>{alert.mitreId}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-mono ${alert.sourceIp !== 'N/A' ? 'text-red-400' : 'text-gray-600'}`}>
                        {alert.sourceIp}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-gray-400 text-xs">{alert.username}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-gray-500 text-xs">{alert.detectionRule}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-gray-500 text-xs">
                        {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-gray-700 text-xs">
                        {new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/alerts/${alert.id}`}>
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                      </Link>
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
