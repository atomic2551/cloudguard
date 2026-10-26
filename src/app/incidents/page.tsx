'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, ChevronRight, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, IncidentDto, IncidentStatus, Severity, AlertSeverity } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function IncidentsPage() {
  const { user } = useAuth();
  const isViewer = user?.roles?.includes('VIEWER') && !user?.roles?.includes('ADMIN') && !user?.roles?.includes('SOC_ANALYST');

  const [incidents, setIncidents] = useState<IncidentDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<AlertSeverity>('HIGH');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Privilege Escalation');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.incidents.list({
        page: 1,
        size: 50,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        severity: filterSeverity === 'ALL' ? undefined : filterSeverity,
        search: debouncedSearch || undefined,
      });
      setIncidents(res.items || []);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      console.error('Failed to load incidents:', err);
      setError('Failed to fetch security incidents from backend.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatus, filterSeverity]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const createIncident = async () => {
    if (!newTitle.trim() || isViewer) return;
    setCreating(true);
    try {
      await api.incidents.create({
        title: newTitle.trim(),
        description: newDesc.trim() || 'Declared from CloudGuard SOC console.',
        severity: newSeverity,
        category: newCategory,
      });
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      setNewSeverity('HIGH');
      await loadIncidents();
    } catch (err: unknown) {
      console.error('Failed to create incident:', err);
      window.alert('Failed to create incident. Please check server logs.');
    } finally {
      setCreating(false);
    }
  };

  const statusOrder: Record<string, number> = { OPEN: 0, INVESTIGATING: 1, CONTAINED: 2, RESOLVED: 3, CLOSED: 4 };

  const counts = useMemo(() => {
    return {
      open: incidents.filter((i) => i.status === 'OPEN').length,
      investigating: incidents.filter((i) => i.status === 'INVESTIGATING').length,
      contained: incidents.filter((i) => i.status === 'CONTAINED').length,
      resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
      closed: incidents.filter((i) => i.status === 'CLOSED').length,
      active: incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length,
    };
  }, [incidents]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Incident Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {counts.active} active · {counts.resolved + counts.closed} resolved · {totalElements} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadIncidents}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {!isViewer && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Create Incident
              </button>
            )}
          </div>
        </div>

        {/* Create incident modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Declare New Security Incident
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. AWS Production Unauthorized IAM Policy Escalation"
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Privilege Escalation">Privilege Escalation</option>
                    <option value="Credential Access">Credential Access</option>
                    <option value="Data Exfiltration">Data Exfiltration</option>
                    <option value="Unauthorized Access">Unauthorized Access</option>
                    <option value="Lateral Movement">Lateral Movement</option>
                    <option value="Security Misconfiguration">Security Misconfiguration</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as AlertSeverity)}
                    className="w-full bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as AlertSeverity[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide initial observations, affected systems, or attacker indicators..."
                    rows={3}
                    className="w-full bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={createIncident}
                    disabled={creating || !newTitle.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-md transition-colors"
                  >
                    {creating ? 'Declaring...' : 'Create Incident'}
                  </button>
                  <button
                    onClick={() => setShowCreate(false)}
                    disabled={creating}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status summary */}
        <div className="grid grid-cols-5 gap-3">
          {(['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'] as IncidentStatus[]).map((status) => {
            const count = counts[status.toLowerCase() as keyof typeof counts] ?? 0;
            const colors: Record<IncidentStatus, string> = {
              OPEN: 'border-red-500/40 bg-red-500/5 text-red-400',
              INVESTIGATING: 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400',
              CONTAINED: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
              RESOLVED: 'border-green-500/40 bg-green-500/5 text-green-400',
              CLOSED: 'border-gray-600/40 bg-gray-600/5 text-gray-500',
            };
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? 'ALL' : status)}
                className={`border rounded-lg px-4 py-3 transition-all text-left ${colors[status]} ${filterStatus === status ? 'ring-2 ring-white/20' : ''}`}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs mt-0.5 opacity-80">{status}</div>
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
              placeholder="Search incidents by title or category..."
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
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(filterSeverity !== 'ALL' || filterStatus !== 'ALL' || search) && (
            <button
              onClick={() => { setFilterSeverity('ALL'); setFilterStatus('ALL'); setSearch(''); }}
              className="text-blue-400 text-sm hover:underline"
            >
              Clear filters
            </button>
          )}
          <span className="text-gray-600 text-sm ml-auto">{totalElements} incidents</span>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={loadIncidents} className="underline hover:text-red-300">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Incident #</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Title & Category</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell w-36">Assigned To</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-20">Alerts</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-32">Created</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-48 bg-gray-800 rounded mb-1" /><div className="h-3 w-24 bg-gray-800/60 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-12 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-600">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No incidents match your criteria</div>
                  </td>
                </tr>
              ) : (
                incidents
                  .slice()
                  .sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99))
                  .map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-800/40 transition-colors group">
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-xs font-mono font-semibold">{inc.incidentNumber || inc.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/incidents/${inc.id}`} className="group-hover:text-blue-400 transition-colors">
                          <div className="text-gray-200 text-sm font-medium">{inc.title}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{inc.category || 'General Incident'}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={inc.severity as Severity} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-300 text-xs">{inc.assignedToName || 'Unassigned'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-400 text-xs bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                          {inc.alertCount ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-500 text-xs">{new Date(inc.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/incidents/${inc.id}`}>
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
