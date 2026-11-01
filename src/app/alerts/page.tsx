'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Filter, Search, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, AlertDto, AlertStatus, Severity } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';

const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const statuses: AlertStatus[] = ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];

export default function AlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.alerts.list({
        page: 1,
        size: 50,
        severity: filterSeverity === 'ALL' ? undefined : filterSeverity,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        search: debouncedSearch || undefined,
      });
      setAlerts(res.items || []);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      console.error('Failed to load alerts:', err);
      setError('Failed to fetch security alerts. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterSeverity, filterStatus]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const counts = {
    new: alerts.filter((a) => a.status === 'NEW').length,
    investigating: alerts.filter((a) => a.status === 'INVESTIGATING').length,
    acknowledged: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length,
    resolved: alerts.filter((a) => a.status === 'RESOLVED').length,
    falsePositive: alerts.filter((a) => a.status === 'FALSE_POSITIVE').length,
    critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
    high: alerts.filter((a) => a.severity === 'HIGH').length,
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">{t('nav.alerts')}</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              {counts.critical} {t('topbar.critical').toLowerCase()} · {counts.high} {t('severity.high').toLowerCase()} · {totalElements} ta umumiy
            </p>
          </div>
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-200 text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 active:bg-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </button>
        </div>

        {/* Summary bar - responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {[
            { label: t('status.new'), count: counts.new, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
            { label: t('status.investigating'), count: counts.investigating, color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
            { label: t('status.acknowledged'), count: counts.acknowledged, color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
            { label: t('status.resolved'), count: counts.resolved, color: 'border-green-500/40 bg-green-500/10 text-green-400' },
            { label: t('status.false_positive'), count: counts.falsePositive, color: 'border-gray-600/40 bg-gray-600/10 text-gray-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`border rounded-xl p-3 sm:px-4 sm:py-3 transition-transform hover:-translate-y-0.5 ${color}`}>
              <div className="text-xl sm:text-2xl font-bold">{count}</div>
              <div className="text-[11px] sm:text-xs mt-0.5 opacity-90 truncate">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800/90 text-gray-200 text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-gray-800/90 text-gray-200 text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">{t('common.all')} ({t('common.severity')})</option>
            {severities.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800/90 text-gray-200 text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">{t('common.all')} ({t('common.status')})</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>

          {(filterSeverity !== 'ALL' || filterStatus !== 'ALL' || search) && (
            <button
              onClick={() => {
                setFilterSeverity('ALL');
                setFilterStatus('ALL');
                setSearch('');
              }}
              className="text-blue-400 text-xs sm:text-sm hover:underline cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          )}
          <span className="text-gray-500 text-xs sm:text-sm ml-auto hidden sm:inline">{totalElements} {t('common.actions').toLowerCase()}</span>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={loadAlerts} className="underline hover:text-red-300">Retry</button>
          </div>
        )}

        {/* Alerts table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Alert</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36 hidden lg:table-cell">Source IP</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36 hidden xl:table-cell">User</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-40 hidden xl:table-cell">Target Resource</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32 hidden md:table-cell">Time</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-48 bg-gray-800 rounded mb-1" /><div className="h-3 w-24 bg-gray-800/60 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-28 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-600">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No alerts match your criteria</div>
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <SeverityBadge severity={alert.severity as Severity} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/alerts/${alert.id}`} className="group-hover:text-blue-400 transition-colors">
                        <div className="text-gray-200 text-sm font-medium">{alert.title}</div>
                        <div className="text-gray-600 text-xs mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-gray-500">{alert.alertNumber || alert.id.slice(0, 8)}</span>
                          <span>·</span>
                          <span>{alert.cloudAccountId ? `Account ${alert.cloudAccountId.slice(0, 8)}` : 'AWS Prod'}</span>
                          {alert.mitreTechniqueId && (
                            <>
                              <span>·</span>
                              <span className="bg-gray-800 px-1.5 py-0.2 rounded text-red-400">{alert.mitreTechniqueId}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-mono ${alert.sourceIp ? 'text-red-400' : 'text-gray-600'}`}>
                        {alert.sourceIp || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-gray-400 text-xs">{alert.userIdentity || 'System'}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-gray-500 text-xs truncate max-w-[150px] inline-block">
                        {alert.targetResource || 'N/A'}
                      </span>
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
