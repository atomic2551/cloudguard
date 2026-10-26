'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, Search, Filter, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { api, SecurityEventDto, Severity } from '@/lib/api';

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
  const [events, setEvents] = useState<SecurityEventDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.events.list({
        page: 1,
        size: 50,
        severity: filterSeverity === 'ALL' ? undefined : filterSeverity,
        search: debouncedSearch || undefined,
      });
      setEvents(res.items || []);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      console.error('Failed to load events:', err);
      setError('Failed to fetch events from backend stream.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterSeverity]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const stats = useMemo(() => {
    return {
      total: totalElements,
      critical: events.filter((e) => e.severity === 'CRITICAL').length,
      high: events.filter((e) => e.severity === 'HIGH').length,
      processed: events.filter((e) => e.processedByEngine).length,
    };
  }, [events, totalElements]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Security Events</h1>
            <p className="text-gray-500 text-sm mt-0.5">Real-time normalized security event stream</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-1.5">
              <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Live Pipeline</span>
            </div>
            <button
              onClick={loadEvents}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: stats.total, color: 'text-gray-200' },
            { label: 'Critical Events', value: stats.critical, color: 'text-red-400' },
            { label: 'High Events', value: stats.high, color: 'text-orange-400' },
            { label: 'Processed by Engine', value: stats.processed, color: 'text-green-400' },
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
              placeholder="Search event type, username, source IP..."
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
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(filterSeverity !== 'ALL' || search) && (
            <button
              onClick={() => { setFilterSeverity('ALL'); setSearch(''); }}
              className="text-blue-400 text-sm hover:underline"
            >
              Clear filters
            </button>
          )}
          <span className="text-gray-600 text-sm ml-auto">{totalElements} events</span>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={loadEvents} className="underline hover:text-red-300">Retry</button>
          </div>
        )}

        {/* Events table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36">Timestamp</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Event Type</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32 hidden md:table-cell">Source IP</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36 hidden lg:table-cell">User Identity</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Target Resource</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24 hidden lg:table-cell">Region</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-800 rounded mb-1" /><div className="h-3 w-20 bg-gray-800/60 rounded" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-32 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-16 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-600">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No security events found</div>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-800/40 transition-colors cursor-pointer group"
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-gray-400 text-xs font-mono">
                        {new Date(event.eventTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-gray-600 text-[11px]">
                        {new Date(event.eventTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-200 text-sm font-medium">
                        {eventTypeLabels[event.eventType] || event.eventType}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {event.eventSource} · {event.cloudAccountName || 'AWS Account'}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-mono ${event.sourceIp ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
                        {event.sourceIp || 'Internal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-300 text-xs">{event.userIdentity || 'Service'}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-gray-400 text-xs font-mono truncate max-w-[200px] inline-block">
                        {event.targetResource || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs">{event.region || 'global'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={event.severity as Severity} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {expandedId === event.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      )}
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
