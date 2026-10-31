'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScanLine, RefreshCw, CheckCircle2, XCircle, Clock, Server, Database, HardDrive, Shield, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, SecurityFindingDto, FindingStatus, Severity } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const scanCategories = [
  { key: 'NETWORK', label: 'Network Security', icon: Shield, description: 'Security Groups, VPC, NACLs' },
  { key: 'STORAGE', label: 'Storage Security', icon: HardDrive, description: 'S3 Buckets, EBS Volumes' },
  { key: 'COMPUTE', label: 'Compute Security', icon: Server, description: 'EC2 Instances, Lambda' },
  { key: 'LOGGING', label: 'Logging & Monitoring', icon: Database, description: 'CloudTrail, CloudWatch' },
];

export default function ScannerPage() {
  const { user } = useAuth();
  const isViewer = user?.roles?.includes('VIEWER') && !user?.roles?.includes('ADMIN') && !user?.roles?.includes('SOC_ANALYST');

  const [findings, setFindings] = useState<SecurityFindingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState<string>('2024-01-15T06:00:00Z');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const loadFindings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.findings.listSecurityFindings({ page: 1, size: 50 });
      setFindings(res.items || []);
    } catch (err: unknown) {
      console.error('Failed to load scanner findings:', err);
      setError('Failed to fetch security scanner findings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFindings();
  }, [loadFindings]);

  const runScan = async () => {
    if (isViewer) return;
    setScanning(true);
    setScanProgress(10);

    const interval = setInterval(() => {
      setScanProgress((prev) => (prev >= 90 ? prev : prev + 25));
    }, 400);

    try {
      await api.findings.triggerScannerRun();
      clearInterval(interval);
      setScanProgress(100);
      setLastScan(new Date().toISOString());
      await loadFindings();
    } catch (err: unknown) {
      console.error('Failed to run scanner:', err);
      clearInterval(interval);
    } finally {
      setTimeout(() => {
        setScanning(false);
        setScanProgress(0);
      }, 600);
    }
  };

  const updateStatus = (id: string, status: FindingStatus) => {
    if (isViewer) return;
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  };

  const filtered = useMemo(() => {
    return activeCategory === 'ALL'
      ? findings
      : findings.filter((f) => f.category === activeCategory);
  }, [findings, activeCategory]);

  const stats = useMemo(() => {
    return {
      total: findings.length,
      critical: findings.filter((f) => f.severity === 'CRITICAL' && f.status === 'OPEN').length,
      high: findings.filter((f) => f.severity === 'HIGH' && f.status === 'OPEN').length,
      medium: findings.filter((f) => f.severity === 'MEDIUM' && f.status === 'OPEN').length,
      low: findings.filter((f) => f.severity === 'LOW' && f.status === 'OPEN').length,
      resources: findings.length > 0 ? new Set(findings.map((f) => f.resourceId).filter(Boolean)).size : (loading ? '—' : 0),
    };
  }, [findings, loading]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Automated Cloud & Host Security Scanner</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Read-only compliance checks across AWS Security Groups, S3 public policies, IAM keys, and CloudTrail
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-gray-500 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Last scan: {new Date(lastScan).toLocaleTimeString()}
            </div>
            {!isViewer && (
              <button
                onClick={runScan}
                disabled={scanning}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-600/20"
              >
                <ScanLine className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
                {scanning ? `Auditing Scope... ${scanProgress}%` : 'Execute Security Scan'}
              </button>
            )}
          </div>
        </div>

        {/* Scan progress */}
        {scanning && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-blue-400 text-sm font-medium">Validating assets against scope.yaml rules...</span>
              </div>
              <span className="text-blue-400 text-sm font-bold">{scanProgress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${scanProgress}%` }} />
            </div>
            <div className="text-gray-500 text-xs mt-2">
              {scanProgress < 30
                ? 'Validating EC2 Security Groups for 0.0.0.0/0 ingress...'
                : scanProgress < 60
                ? 'Inspecting S3 buckets for public read ACLs and encryption...'
                : scanProgress < 85
                ? 'Auditing IAM key age (> 90 days) and active credentials...'
                : 'Finalizing findings and computing risk scores...'}
            </div>
          </div>
        )}

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

        {/* Summary stats */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Scanned Resources', value: stats.resources, color: 'text-gray-300' },
            { label: 'Total Findings', value: stats.total, color: 'text-gray-300' },
            { label: 'Critical', value: stats.critical, color: 'text-red-400' },
            { label: 'High', value: stats.high, color: 'text-orange-400' },
            { label: 'Medium', value: stats.medium, color: 'text-yellow-400' },
            { label: 'Low', value: stats.low, color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-gray-600 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Scan categories */}
        <div className="grid grid-cols-4 gap-3">
          {scanCategories.map((cat) => {
            const Icon = cat.icon;
            const catFindings = findings.filter((f) => f.category === cat.key);
            const hasCritical = catFindings.some((f) => f.severity === 'CRITICAL' && f.status === 'OPEN');
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? 'ALL' : cat.key)}
                className={`bg-gray-900 border rounded-lg p-4 text-left transition-colors hover:border-gray-600 ${
                  activeCategory === cat.key ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${hasCritical ? 'text-red-400' : 'text-gray-500'}`} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${hasCritical ? 'bg-red-500/15 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
                    {catFindings.filter((f) => f.status === 'OPEN').length} open
                  </span>
                </div>
                <div className="text-gray-200 text-sm font-medium">{cat.label}</div>
                <div className="text-gray-600 text-xs mt-0.5">{cat.description}</div>
              </button>
            );
          })}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          {['ALL', 'NETWORK', 'STORAGE', 'COMPUTE', 'LOGGING', 'ENCRYPTION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                activeCategory === cat
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {cat}
              <span className="ml-1.5 text-gray-600">
                ({cat === 'ALL' ? findings.length : findings.filter((f) => f.category === cat).length})
              </span>
            </button>
          ))}
        </div>

        {/* Findings list */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse">
                <div className="h-5 w-48 bg-gray-800 rounded mb-2" />
                <div className="h-4 w-96 bg-gray-800/60 rounded" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500 text-sm">
              No configuration findings recorded for this category.
            </div>
          ) : (
            filtered.map((finding) => (
              <div
                key={finding.id}
                className={`bg-gray-900 border rounded-lg p-4 hover:border-gray-700 transition-colors ${
                  finding.severity === 'CRITICAL' && finding.status === 'OPEN'
                    ? 'border-red-900/50'
                    : 'border-gray-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <SeverityBadge severity={finding.severity as Severity} />
                      <StatusBadge status={finding.status} />
                      <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">{finding.category}</span>
                      <span className="text-gray-600 text-xs ml-auto font-mono">{finding.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-gray-200 text-sm font-semibold mb-1">{finding.title}</h3>
                    <p className="text-gray-400 text-xs mb-2">{finding.description}</p>
                    <div className="grid grid-cols-3 gap-3 mb-2 text-xs">
                      <div>
                        <span className="text-gray-500">Target Resource: </span>
                        <span className="text-gray-400 font-mono">{finding.resourceId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Region: </span>
                        <span className="text-gray-400">{finding.region || 'us-east-1'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Risk Score: </span>
                        <span className={`font-bold ${finding.riskScore == null ? 'text-gray-600' : finding.riskScore >= 90 ? 'text-red-400' : finding.riskScore >= 70 ? 'text-orange-400' : 'text-yellow-400'}`}>
                          {finding.riskScore !== undefined ? `${finding.riskScore}/100` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {finding.recommendation && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded p-2 mb-2">
                        <span className="text-green-400 text-xs font-medium">Remediation: </span>
                        <span className="text-gray-300 text-xs">{finding.recommendation}</span>
                      </div>
                    )}
                  </div>
                  {!isViewer && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {finding.status === 'OPEN' && (
                        <button
                          onClick={() => updateStatus(finding.id, 'ACKNOWLEDGED')}
                          className="text-xs bg-purple-600/15 border border-purple-600/30 text-purple-400 px-3 py-1.5 rounded hover:bg-purple-600/25 transition-colors whitespace-nowrap"
                        >
                          Acknowledge
                        </button>
                      )}
                      {finding.status !== 'REMEDIATED' && finding.status !== 'SUPPRESSED' && (
                        <button
                          onClick={() => updateStatus(finding.id, 'REMEDIATED')}
                          className="text-xs bg-green-600/15 border border-green-600/30 text-green-400 px-3 py-1.5 rounded hover:bg-green-600/25 transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Remediated
                        </button>
                      )}
                      {finding.status !== 'SUPPRESSED' && finding.status !== 'REMEDIATED' && (
                        <button
                          onClick={() => updateStatus(finding.id, 'SUPPRESSED')}
                          className="text-xs bg-gray-700/50 border border-gray-700 text-gray-500 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Suppress
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
    </AppLayout>
  );
}
