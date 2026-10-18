'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockFindings, type FindingStatus } from '@/lib/mock-data';

type Category = 'IAM' | 'NETWORK' | 'STORAGE' | 'COMPUTE' | 'LOGGING' | 'ENCRYPTION';

const categoryColors: Record<string, string> = {
  IAM: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  NETWORK: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  STORAGE: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  COMPUTE: 'text-green-400 bg-green-500/10 border-green-500/30',
  LOGGING: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  ENCRYPTION: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

export default function FindingsPage() {
  const [findings, setFindings] = useState(mockFindings);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch = !search ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.resource.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'ALL' || f.category === filterCategory;
      const matchSev = filterSeverity === 'ALL' || f.severity === filterSeverity;
      const matchStat = filterStatus === 'ALL' || f.status === filterStatus;
      return matchSearch && matchCat && matchSev && matchStat;
    });
  }, [findings, search, filterCategory, filterSeverity, filterStatus]);

  const updateStatus = (id: string, status: FindingStatus) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const categories: Category[] = ['IAM', 'NETWORK', 'STORAGE', 'COMPUTE', 'LOGGING', 'ENCRYPTION'];

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Security Findings</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {filtered.filter(f => f.status === 'OPEN').length} open ·{' '}
              {filtered.filter(f => f.severity === 'CRITICAL' && f.status === 'OPEN').length} critical ·{' '}
              {filtered.length} total findings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-gray-800 text-gray-200' : 'text-gray-600 hover:text-gray-400'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-800 text-gray-200' : 'text-gray-600 hover:text-gray-400'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category summary */}
        <div className="grid grid-cols-6 gap-3">
          {categories.map(cat => {
            const count = findings.filter(f => f.category === cat && f.status === 'OPEN').length;
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
              placeholder="Search findings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-500" />
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
            <option value="ALL">All Severities</option>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
            <option value="ALL">All Statuses</option>
            {['OPEN', 'ACKNOWLEDGED', 'REMEDIATED', 'SUPPRESSED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} findings</span>
        </div>

        {/* Findings */}
        {viewMode === 'table' ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Finding</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Category</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36 hidden md:table-cell">Resource</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-20 hidden lg:table-cell">Risk</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Status</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32 hidden lg:table-cell">Detected</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((finding) => (
                  <tr key={finding.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3"><SeverityBadge severity={finding.severity} /></td>
                    <td className="px-4 py-3">
                      <div className="text-gray-200 text-sm font-medium">{finding.title}</div>
                      <div className="text-gray-600 text-xs mt-0.5">{finding.description.substring(0, 80)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs border rounded px-1.5 py-0.5 ${categoryColors[finding.category]}`}>
                        {finding.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-500 text-xs font-mono">{finding.resource.substring(0, 25)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-bold ${finding.riskScore >= 90 ? 'text-red-400' : finding.riskScore >= 70 ? 'text-orange-400' : 'text-yellow-400'}`}>
                        {finding.riskScore}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={finding.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-600 text-xs">{new Date(finding.detectedAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      {finding.status === 'OPEN' && (
                        <button onClick={() => updateStatus(finding.id, 'ACKNOWLEDGED')}
                          className="text-xs bg-purple-600/15 border border-purple-600/30 text-purple-400 px-2 py-1 rounded hover:bg-purple-600/25 transition-colors">
                          Ack
                        </button>
                      )}
                      {finding.status === 'ACKNOWLEDGED' && (
                        <button onClick={() => updateStatus(finding.id, 'REMEDIATED')}
                          className="text-xs bg-green-600/15 border border-green-600/30 text-green-400 px-2 py-1 rounded hover:bg-green-600/25 transition-colors">
                          Remediate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((finding) => (
              <div key={finding.id} className={`bg-gray-900 border rounded-lg p-4 hover:border-gray-700 transition-colors ${
                finding.severity === 'CRITICAL' && finding.status === 'OPEN' ? 'border-red-900/50' : 'border-gray-800'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityBadge severity={finding.severity} />
                    <span className={`text-xs border rounded px-1.5 py-0.5 ${categoryColors[finding.category]}`}>{finding.category}</span>
                  </div>
                  <StatusBadge status={finding.status} />
                </div>
                <h3 className="text-gray-200 text-sm font-semibold mb-1">{finding.title}</h3>
                <p className="text-gray-500 text-xs mb-3">{finding.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="font-mono">{finding.resource.substring(0, 30)}</span>
                  <span className="ml-auto">Risk: <span className="text-orange-400 font-bold">{finding.riskScore}</span></span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {finding.status === 'OPEN' && (
                    <button onClick={() => updateStatus(finding.id, 'ACKNOWLEDGED')}
                      className="text-xs bg-purple-600/15 border border-purple-600/30 text-purple-400 px-3 py-1 rounded hover:bg-purple-600/25 transition-colors">
                      Acknowledge
                    </button>
                  )}
                  {(finding.status === 'OPEN' || finding.status === 'ACKNOWLEDGED') && (
                    <button onClick={() => updateStatus(finding.id, 'REMEDIATED')}
                      className="text-xs bg-green-600/15 border border-green-600/30 text-green-400 px-3 py-1 rounded hover:bg-green-600/25 transition-colors">
                      Mark Remediated
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
