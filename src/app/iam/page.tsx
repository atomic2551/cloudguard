'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Shield, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Search, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import DemoDataBadge from '@/components/ui/DemoDataBadge';
import { api, IamFindingDto, FindingStatus, Severity } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const staticIamUsers = [
  { name: 'jsmith', type: 'User', mfa: false, adminAccess: true, lastActivity: '2024-01-15', accessKeys: 1, keyAge: 32, status: 'ACTIVE' },
  { name: 'maria.santos', type: 'User', mfa: true, adminAccess: false, lastActivity: '2024-01-15', accessKeys: 1, keyAge: 120, status: 'ACTIVE' },
  { name: 'david.kim', type: 'User', mfa: true, adminAccess: false, lastActivity: '2023-10-01', accessKeys: 2, keyAge: 200, status: 'INACTIVE' },
  { name: 'terraform-ci', type: 'Service', mfa: false, adminAccess: false, lastActivity: '2024-01-15', accessKeys: 1, keyAge: 45, status: 'ACTIVE' },
  { name: 'devops-prod', type: 'User', mfa: true, adminAccess: false, lastActivity: '2024-01-15', accessKeys: 1, keyAge: 67, status: 'ACTIVE' },
  { name: 'svc-cloudops', type: 'Service', mfa: false, adminAccess: false, lastActivity: '2024-01-15', accessKeys: 1, keyAge: 15, status: 'ACTIVE' },
  { name: 'root', type: 'Root', mfa: false, adminAccess: true, lastActivity: '2024-01-14', accessKeys: 0, keyAge: 0, status: 'ACTIVE' },
  { name: 'backdoor-svc', type: 'User', mfa: false, adminAccess: true, lastActivity: '2024-01-15', accessKeys: 1, keyAge: 0, status: 'LOCKED' },
];

export default function IAMPage() {
  const { user } = useAuth();
  const isViewer = user?.roles?.includes('VIEWER') && !user?.roles?.includes('ADMIN') && !user?.roles?.includes('SOC_ANALYST');

  const [findings, setFindings] = useState<IamFindingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState('2024-01-15T06:00:00Z');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadIamFindings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.findings.listIamFindings({
        page: 1,
        size: 50,
        severity: filterSeverity === 'ALL' ? undefined : filterSeverity,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        search: debouncedSearch || undefined,
      });
      setFindings(res.items || []);
    } catch (err: unknown) {
      console.error('Failed to load IAM findings:', err);
      setError('Failed to fetch IAM findings from auditor backend.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterSeverity, filterStatus]);

  useEffect(() => {
    loadIamFindings();
  }, [loadIamFindings]);

  const runScan = async () => {
    if (isViewer) return;
    setScanning(true);
    try {
      await api.findings.triggerIamScan();
      setLastScan(new Date().toISOString());
      await loadIamFindings();
    } catch (err: unknown) {
      console.error('Failed to trigger IAM scan:', err);
    } finally {
      setScanning(false);
    }
  };

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateFindingStatus = async (id: string, status: FindingStatus) => {
    if (isViewer) return;
    setUpdatingId(id);
    try {
      await api.findings.updateIamFindingStatus(id, status);
      await loadIamFindings();
    } catch (err: unknown) {
      console.error('Failed to update IAM finding status:', err);
      window.alert('Failed to update IAM finding status. Please check your permissions.');
    } finally {
      setUpdatingId(null);
    }
  };

  const iamScore = findings.length > 0 ? Math.max(0, 100 - findings.filter((f) => f.status === 'OPEN').length * 10) : null;
  const scoreColor = iamScore === null ? 'text-gray-500' : iamScore >= 80 ? 'text-green-400' : iamScore >= 60 ? 'text-yellow-400' : 'text-red-400';

  const filteredFindings = useMemo(() => {
    return findings;
  }, [findings]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">IAM Security Auditor & Principal Hygiene</h1>
              <DemoDataBadge tooltip="Principals list is simulated; findings stream is live from backend" />
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
              AWS Identity & Access Management security posture and excessive privilege scanner
            </p>
          </div>
          {!isViewer && (
            <button
              onClick={runScan}
              disabled={scanning}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Auditing IAM...' : 'Run IAM Scan'}
            </button>
          )}
        </div>

        {/* Score + summary */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-medium">IAM Posture Score</span>
              <span className="text-[10px] text-amber-400 font-mono">ESTIMATED</span>
            </div>
            <div className={`text-4xl font-bold ${scoreColor}`}>{iamScore !== null ? iamScore : '—'}</div>
            <div className="text-gray-500 text-xs mt-1">/100 (Client-side calculated)</div>
            <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${iamScore === null ? 'bg-gray-700' : iamScore >= 80 ? 'bg-green-500' : iamScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${iamScore !== null ? iamScore : 0}%` }}
              />
            </div>
            <div className="text-gray-500 text-xs mt-2">Last scan: {new Date(lastScan).toLocaleTimeString()}</div>
          </div>
          {[
            { label: 'Total IAM Users', value: staticIamUsers.filter((u) => u.type === 'User').length, icon: Users, color: 'text-blue-400' },
            { label: 'Admin Access', value: staticIamUsers.filter((u) => u.adminAccess).length, icon: Shield, color: 'text-red-400' },
            { label: 'MFA Not Enabled', value: staticIamUsers.filter((u) => !u.mfa && u.type !== 'Service').length, icon: XCircle, color: 'text-orange-400' },
            { label: 'Inactive Users', value: staticIamUsers.filter((u) => u.status === 'INACTIVE').length, icon: AlertTriangle, color: 'text-yellow-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-gray-500 text-xs">{label}</span>
              </div>
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* IAM Users table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h2 className="text-gray-300 text-sm font-semibold">Audited Principals & Service Roles</h2>
            <span className="text-gray-600 text-xs">{staticIamUsers.length} principals</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/40 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5">User</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-20">Type</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-24">MFA</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-28">Admin Access</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-28 hidden md:table-cell">Key Age</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-28 hidden lg:table-cell">Last Active</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-24">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-24 hidden xl:table-cell">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {staticIamUsers.map((userItem) => {
                const riskScore = (userItem.adminAccess ? 40 : 0) + (!userItem.mfa && userItem.type !== 'Service' ? 20 : 0) + (userItem.keyAge > 90 ? 20 : 0) + (userItem.status === 'INACTIVE' ? 20 : 0);
                const riskColor = riskScore >= 60 ? 'text-red-400' : riskScore >= 30 ? 'text-orange-400' : 'text-green-400';
                return (
                  <tr key={userItem.name} className={`hover:bg-gray-800/30 transition-colors ${userItem.status === 'LOCKED' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="text-gray-200 text-sm font-mono font-medium">{userItem.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 text-xs">{userItem.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      {userItem.type === 'Service' ? (
                        <span className="text-gray-600 text-xs">N/A</span>
                      ) : userItem.mfa ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {userItem.adminAccess ? (
                        <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> ADMIN
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">Limited</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {userItem.accessKeys > 0 ? (
                        <span className={`text-xs font-medium ${userItem.keyAge > 90 ? 'text-red-400' : userItem.keyAge > 60 ? 'text-orange-400' : 'text-green-400'}`}>
                          {userItem.keyAge} days
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">No keys</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs ${userItem.status === 'INACTIVE' ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {userItem.lastActivity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={userItem.status} />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className={`text-xs font-bold ${riskColor}`}>
                        {riskScore > 0 ? `${riskScore}%` : 'Low'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={loadIamFindings} className="underline hover:text-red-300">Retry</button>
          </div>
        )}

        {/* IAM Findings */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-gray-200 text-base font-semibold">IAM Security Findings ({findings.length})</h2>
            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search findings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-1.5 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
                />
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-md border border-gray-700 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-md border border-gray-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                {['OPEN', 'ACKNOWLEDGED', 'REMEDIATED', 'SUPPRESSED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="h-5 w-48 bg-gray-800 rounded mb-2" />
                  <div className="h-4 w-96 bg-gray-800/60 rounded" />
                </div>
              ))
            ) : filteredFindings.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">
                No IAM security findings recorded.
              </div>
            ) : (
              filteredFindings.map((finding) => (
                <div key={finding.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <SeverityBadge severity={finding.severity as Severity} />
                        <StatusBadge status={finding.status} />
                        <span className="text-gray-500 text-xs">{finding.category}</span>
                        <span className="text-gray-600 text-xs ml-auto">{new Date(finding.detectedAt || finding.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-gray-200 text-sm font-semibold mb-1">{finding.title}</h3>
                      <p className="text-gray-400 text-xs mb-2">{finding.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-600 text-xs">Affected Principal:</span>
                        <span className="text-red-400 text-xs font-mono font-medium">{finding.affectedPrincipal}</span>
                      </div>
                      {finding.recommendation && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded p-2">
                          <span className="text-blue-400 text-xs font-medium">Recommendation: </span>
                          <span className="text-gray-400 text-xs">{finding.recommendation}</span>
                        </div>
                      )}
                    </div>
                    {!isViewer && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {finding.status === 'OPEN' && (
                          <button
                            onClick={() => updateFindingStatus(finding.id, 'ACKNOWLEDGED')}
                            className="text-xs bg-purple-600/20 border border-purple-600/40 text-purple-400 px-3 py-1 rounded hover:bg-purple-600/30 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        {finding.status !== 'REMEDIATED' && (
                          <button
                            onClick={() => updateFindingStatus(finding.id, 'REMEDIATED')}
                            className="text-xs bg-green-600/20 border border-green-600/40 text-green-400 px-3 py-1 rounded hover:bg-green-600/30 transition-colors"
                          >
                            Mark Remediated
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
