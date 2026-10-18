'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Filter, ChevronRight, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockIncidents, type IncidentStatus, type Severity } from '@/lib/mock-data';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<Severity>('HIGH');
  const [newDesc, setNewDesc] = useState('');

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      const matchSearch = !search || inc.title.toLowerCase().includes(search.toLowerCase()) ||
        inc.category.toLowerCase().includes(search.toLowerCase()) ||
        inc.assignedTo.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || inc.status === filterStatus;
      const matchSeverity = filterSeverity === 'ALL' || inc.severity === filterSeverity;
      return matchSearch && matchStatus && matchSeverity;
    });
  }, [incidents, search, filterStatus, filterSeverity]);

  const createIncident = () => {
    if (!newTitle.trim()) return;
    const newInc = {
      id: `INC-00${incidents.length + 1}`,
      title: newTitle,
      description: newDesc || 'Incident created from CloudGuard dashboard.',
      severity: newSeverity,
      status: 'OPEN' as IncidentStatus,
      assignedTo: 'Unassigned',
      relatedAlerts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: 'Manual',
      timeline: [{ id: 'tl1', timestamp: new Date().toISOString(), type: 'INCIDENT_CREATED', description: 'Incident created manually', actor: 'Sarah Chen' }],
      notes: [],
      evidence: [],
    };
    setIncidents(prev => [newInc, ...prev]);
    setShowCreate(false);
    setNewTitle('');
    setNewDesc('');
    setNewSeverity('HIGH');
  };

  const statusOrder: Record<string, number> = { OPEN: 0, INVESTIGATING: 1, CONTAINED: 2, RESOLVED: 3, CLOSED: 4 };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Incident Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length} active ·{' '}
              {incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length} resolved
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Incident
          </button>
        </div>

        {/* Create incident modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Create New Incident
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Incident title..."
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Severity)}
                    className="w-full bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe the incident..."
                    rows={3}
                    className="w-full bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={createIncident}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
                  >
                    Create Incident
                  </button>
                  <button
                    onClick={() => setShowCreate(false)}
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
            const count = incidents.filter(i => i.status === status).length;
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
                className={`border rounded-lg px-4 py-3 transition-all ${colors[status]} ${filterStatus === status ? 'ring-2 ring-white/20' : ''}`}
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
              placeholder="Search incidents..."
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
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} incidents</span>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">ID</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Title</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell w-36">Assigned To</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-20">Alerts</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-32">Created</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]).map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="text-gray-500 text-xs font-mono">{inc.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/incidents/${inc.id}`} className="group-hover:text-blue-400 transition-colors">
                      <div className="text-gray-200 text-sm font-medium">{inc.title}</div>
                      <div className="text-gray-600 text-xs mt-0.5">{inc.category}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inc.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-gray-400 text-xs">{inc.assignedTo}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gray-400 text-xs bg-gray-800 px-2 py-0.5 rounded">{inc.relatedAlerts.length}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
