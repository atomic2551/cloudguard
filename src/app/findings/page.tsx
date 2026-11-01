'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, LayoutGrid, List, RefreshCw, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, SecurityFindingDto, FindingCategory, FindingStatus, Severity } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const categoryColors: Record<string, string> = {
  IAM: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  NETWORK: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  STORAGE: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  COMPUTE: 'text-green-400 bg-green-500/10 border-green-500/30',
  LOGGING: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  ENCRYPTION: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

const categories: FindingCategory[] = ['IAM', 'NETWORK', 'STORAGE', 'COMPUTE', 'LOGGING', 'ENCRYPTION'];

export default function FindingsPage() {
  const { user } = useAuth();
  const isViewer = user?.roles?.includes('VIEWER') && !user?.roles?.includes('ADMIN') && !user?.roles?.includes('SOC_ANALYST');

  const [findings, setFindings] = useState<SecurityFindingDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadFindings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.findings.listSecurityFindings({
        page: 1,
        size: 50,
        severity: filterSeverity === 'ALL' ? undefined : filterSeverity,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        category: filterCategory === 'ALL' ? undefined : filterCategory,
        search: debouncedSearch || undefined,
      });
      setFindings(res.items || []);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      console.error('Failed to load findings:', err);
      setError('Failed to fetch security findings from scanner backend.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterCategory, filterSeverity, filterStatus]);

  useEffect(() => {
    loadFindings();
  }, [loadFindings]);

  const updateStatus = async (id: string, status: FindingStatus) => {
    if (isViewer) return;
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  };

  const filtered = useMemo(() => {
    return findings;
  }, [findings]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Security Findings</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {findings.filter((f) => f.status === 'OPEN').length} open ·{' '}
              {findings.filter((f) => f.severity === 'CRITICAL' && f.status === 'OPEN').length} critical ·{' '}
              {totalElements} total findings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadFindings}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex items-center gap-1 border border-gray-800 rounded-md p-0.5 bg-gray-900">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-800 text-gray-200' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-800 text-gray-200' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category summary */}
        <div className="grid grid-cols-6 gap-3">
          {categories.map((cat) => {
            const count = findings.filter((f) => f.category === cat && f.status === 'OPEN').length;
            const colorClass = categoryColors[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? 'ALL' : cat)}
                className={`border rounded-lg px-3 py-3 text-center transition-all ${colorClass} ${filterCategory === cat ? 'ring-2 ring-white/20' : 'opacity-70 hover:opacity-100'}`}
              >
                <div className="text-xl font-bold">{count}</div>
                <div className="text-xs mt-0.5 font-medium">{cat}</div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search findings by title, resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            {['OPEN', 'ACKNOWLEDGED', 'REMEDIATED', 'SUPPRESSED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} findings</span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={loadFindings} className="underline hover:text-red-300">Retry</button>
          </div>
        )}

        {/* Findings */}
        {viewMode === 'table' ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Finding</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Category</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-40 hidden md:table-cell">Resource</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-20 hidden lg:table-cell">Risk</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Status</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32 hidden lg:table-cell">Detected</th>
                  {!isViewer && <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-48 bg-gray-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-800 rounded" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-28 bg-gray-800 rounded" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-12 bg-gray-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-800 rounded" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                      {!isViewer && <td className="px-4 py-3"></td>}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isViewer ? 7 : 8} className="text-center py-12 text-gray-600">
                      No security findings match your criteria
                    </td>
                  </tr>
                ) : (
                  filtered.map((finding) => (
                    <tr key={finding.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3"><SeverityBadge severity={finding.severity as Severity} /></td>
                      <td className="px-4 py-3">
                        <div className="text-gray-200 text-sm font-medium">{finding.title}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{finding.description ? finding.description.substring(0, 80) + '...' : ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs border rounded px-1.5 py-0.5 ${categoryColors[finding.category] || 'bg-gray-800 text-gray-400'}`}>
                          {finding.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-400 text-xs font-mono">{finding.resourceId?.substring(0, 30) || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs font-bold ${finding.riskScore == null ? 'text-gray-600' : finding.riskScore >= 90 ? 'text-red-400' : finding.riskScore >= 70 ? 'text-orange-400' : 'text-yellow-400'}`}>
                          {finding.riskScore !== undefined ? finding.riskScore : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={finding.status} /></td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-500 text-xs">{new Date(finding.detectedAt || finding.createdAt).toLocaleDateString()}</span>
                      </td>
                      {!isViewer && (
                        <td className="px-4 py-3">
                          {finding.status === 'OPEN' && (
                            <button
                              onClick={() => updateStatus(finding.id, 'ACKNOWLEDGED')}
                              className="text-xs bg-purple-600/15 border border-purple-600/30 text-purple-400 px-2 py-1 rounded hover:bg-purple-600/25 transition-colors"
                            >
                              Ack
                            </button>
                          )}
                          {finding.status === 'ACKNOWLEDGED' && (
                            <button
                              onClick={() => updateStatus(finding.id, 'REMEDIATED')}
                              className="text-xs bg-green-600/15 border border-green-600/30 text-green-400 px-2 py-1 rounded hover:bg-green-600/25 transition-colors"
                            >
                              Remediate
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((finding) => (
              <div
                key={finding.id}
                className={`bg-gray-900 border rounded-lg p-4 hover:border-gray-700 transition-colors ${
                  finding.severity === 'CRITICAL' && finding.status === 'OPEN' ? 'border-red-900/50' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityBadge severity={finding.severity as Severity} />
                    <span className={`text-xs border rounded px-1.5 py-0.5 ${categoryColors[finding.category] || 'bg-gray-800 text-gray-400'}`}>
                      {finding.category}
                    </span>
                  </div>
                  <StatusBadge status={finding.status} />
                </div>
                <h3 className="text-gray-200 text-sm font-semibold mb-1">{finding.title}</h3>
                <p className="text-gray-500 text-xs mb-3">{finding.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="font-mono text-gray-400">{finding.resourceId?.substring(0, 30)}</span>
                  <span className="ml-auto">Risk: <span className="text-orange-400 font-bold">{finding.riskScore !== undefined ? finding.riskScore : '—'}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
