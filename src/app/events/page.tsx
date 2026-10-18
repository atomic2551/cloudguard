'use client';

import { useState, useMemo } from 'react';
import { Activity, Search, Filter, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { mockSecurityEvents, type Severity } from '@/lib/mock-data';

const eventTypeLabels: Record<string, string> = {
  ConsoleLogin: 'Console Login',
  AttachUserPolicy: 'IAM Policy Attached',
  PutBucketAcl: 'S3 ACL Changed',
  AuthorizeSecurityGroupIngress: 'Security Group Modified',
  CreateUser: 'IAM User Created',
  DetachRolePolicy: 'IAM Policy Detached',
  StopLogging: 'CloudTrail Stopped',
  ModifyDBInstance: 'RDS Modified',
  RunInstances: 'EC2 Instance Started',
  DeleteAccessKey: 'Access Key Deleted',
  GetSecretValue: 'Secret Accessed',
};

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockSecurityEvents.filter((e) => {
      const matchSearch = !search ||
        e.eventType.toLowerCase().includes(search.toLowerCase()) ||
        e.sourceIp.includes(search) ||
        e.username.toLowerCase().includes(search.toLowerCase()) ||
        e.resource.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = filterSeverity === 'ALL' || e.severity === filterSeverity;
      const matchSource = filterSource === 'ALL' || e.source === filterSource;
      return matchSearch && matchSeverity && matchSource;
    });
  }, [search, filterSeverity, filterSource]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Security Events</h1>
            <p className="text-gray-500 text-sm mt-0.5">Real-time cloud security event stream</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-1.5">
              <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Live</span>
            </div>
            <button className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {([
            { label: 'Total Events (24h)', value: mockSecurityEvents.length, color: 'text-gray-200' },
            { label: 'Critical Events', value: mockSecurityEvents.filter(e => e.severity === 'CRITICAL').length, color: 'text-red-400' },
            { label: 'High Events', value: mockSecurityEvents.filter(e => e.severity === 'HIGH').length, color: 'text-orange-400' },
            { label: 'Processed', value: mockSecurityEvents.filter(e => e.processed).length, color: 'text-green-400' },
          ] as { label: string; value: number; color: string }[]).map(({ label, value, color }) => (
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
              placeholder="Search events..."
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
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none"
          >
            <option value="ALL">All Sources</option>
            <option value="AWS_CLOUDTRAIL">CloudTrail</option>
            <option value="AWS_CLOUDWATCH">CloudWatch</option>
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} events</span>
        </div>

        {/* Events table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36">Timestamp</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Event Type</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32 hidden md:table-cell">Source IP</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36 hidden lg:table-cell">User</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Resource</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24 hidden lg:table-cell">Region</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((event) => (
                <>
                  <tr
                    key={event.id}
                    className="hover:bg-gray-800/40 transition-colors cursor-pointer group"
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-gray-400 text-xs font-mono">
                        {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-gray-700 text-xs">
                        {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-200 text-sm font-medium">{eventTypeLabels[event.eventType] ?? event.eventType}</div>
                      <div className="text-gray-600 text-xs mt-0.5">{event.source.replace('_', ' ')} · {event.cloudAccount}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-mono ${event.sourceIp.startsWith('10.') ? 'text-gray-400' : 'text-red-400'}`}>
                        {event.sourceIp}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-400 text-xs">{event.username}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-gray-500 text-xs font-mono">{event.resource.length > 50 ? event.resource.slice(0, 50) + '…' : event.resource}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs">{event.region}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={event.severity} />
                    </td>
                    <td className="px-4 py-3">
                      {expandedId === event.id
                        ? <ChevronUp className="w-4 h-4 text-gray-500" />
                        : <ChevronDown className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />}
                    </td>
                  </tr>
                  {expandedId === event.id && (
                    <tr key={`${event.id}-expanded`}>
                      <td colSpan={8} className="bg-gray-800/30 px-4 py-4 border-b border-gray-800">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Event Details</h3>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex gap-3"><span className="text-gray-600 w-24">Event ID</span><span className="text-gray-400 font-mono">{event.id}</span></div>
                              <div className="flex gap-3"><span className="text-gray-600 w-24">Full Resource</span><span className="text-gray-400 font-mono break-all">{event.resource}</span></div>
                              <div className="flex gap-3"><span className="text-gray-600 w-24">Source</span><span className="text-gray-400">{event.source}</span></div>
                              <div className="flex gap-3"><span className="text-gray-600 w-24">Processed</span><span className={event.processed ? 'text-green-400' : 'text-yellow-400'}>{event.processed ? 'Yes' : 'Pending'}</span></div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Raw Event</h3>
                            <pre className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-green-400 font-mono overflow-x-auto max-h-36">
                              {JSON.stringify(event.rawEvent, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
