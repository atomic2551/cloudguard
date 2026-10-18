'use client';

import { useState } from 'react';
import { ScanLine, RefreshCw, CheckCircle2, XCircle, Clock, Server, Database, HardDrive, Shield } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockFindings, type FindingStatus } from '@/lib/mock-data';

const scanCategories = [
  { key: 'NETWORK', label: 'Network Security', icon: Shield, count: 3, description: 'Security Groups, VPC, NACLs' },
  { key: 'STORAGE', label: 'Storage Security', icon: HardDrive, count: 2, description: 'S3 Buckets, EBS Volumes' },
  { key: 'COMPUTE', label: 'Compute Security', icon: Server, count: 1, description: 'EC2 Instances, Lambda' },
  { key: 'LOGGING', label: 'Logging & Monitoring', icon: Database, count: 1, description: 'CloudTrail, CloudWatch' },
];

export default function ScannerPage() {
  const [findings, setFindings] = useState(mockFindings);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState('2024-01-15T06:00:00Z');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const runScan = () => {
    setScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          setLastScan(new Date().toISOString());
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  const updateStatus = (id: string, status: FindingStatus) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const filtered = activeCategory === 'ALL' ? findings : findings.filter(f => f.category === activeCategory);

  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'CRITICAL' && f.status === 'OPEN').length,
    high: findings.filter(f => f.severity === 'HIGH' && f.status === 'OPEN').length,
    medium: findings.filter(f => f.severity === 'MEDIUM' && f.status === 'OPEN').length,
    low: findings.filter(f => f.severity === 'LOW' && f.status === 'OPEN').length,
    resources: 266,
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Cloud Security Scanner</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Automated configuration scanning across all cloud accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-gray-500 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Last scan: {new Date(lastScan).toLocaleString()}
            </div>
            <button
              onClick={runScan}
              disabled={scanning}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm px-4 py-2 rounded-md transition-colors"
            >
              <ScanLine className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
              {scanning ? `Scanning... ${scanProgress}%` : 'Run Scan'}
            </button>
          </div>
        </div>

        {/* Scan progress */}
        {scanning && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-blue-400 text-sm font-medium">Scanning cloud resources...</span>
              </div>
              <span className="text-blue-400 text-sm font-bold">{scanProgress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${scanProgress}%` }} />
            </div>
            <div className="text-gray-500 text-xs mt-2">
              {scanProgress < 30 ? 'Fetching EC2 instances and Security Groups...' :
               scanProgress < 60 ? 'Checking S3 bucket policies and ACLs...' :
               scanProgress < 85 ? 'Analyzing IAM configurations...' :
               'Generating findings report...'}
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Resources Scanned', value: stats.resources, color: 'text-gray-300' },
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
            const catFindings = findings.filter(f => f.category === cat.key);
            const hasCritical = catFindings.some(f => f.severity === 'CRITICAL' && f.status === 'OPEN');
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
                    {catFindings.filter(f => f.status === 'OPEN').length} open
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
          {['ALL', 'NETWORK', 'STORAGE', 'COMPUTE', 'IAM', 'LOGGING', 'ENCRYPTION'].map((cat) => (
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
                ({cat === 'ALL' ? findings.length : findings.filter(f => f.category === cat).length})
              </span>
            </button>
          ))}
        </div>

        {/* Findings list */}
        <div className="space-y-3">
          {filtered.map((finding) => (
            <div key={finding.id} className={`bg-gray-900 border rounded-lg p-4 hover:border-gray-700 transition-colors ${
              finding.severity === 'CRITICAL' && finding.status === 'OPEN'
                ? 'border-red-900/50'
                : 'border-gray-800'
            }`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <SeverityBadge severity={finding.severity} />
                    <StatusBadge status={finding.status} />
                    <span className="text-gray-600 text-xs bg-gray-800 px-2 py-0.5 rounded">{finding.category}</span>
                    <span className="text-gray-700 text-xs ml-auto">{finding.id}</span>
                  </div>
                  <h3 className="text-gray-200 text-sm font-semibold mb-1">{finding.title}</h3>
                  <p className="text-gray-500 text-xs mb-2">{finding.description}</p>
                  <div className="grid grid-cols-3 gap-3 mb-2 text-xs">
                    <div>
                      <span className="text-gray-600">Resource: </span>
                      <span className="text-gray-400 font-mono">{finding.resource}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Region: </span>
                      <span className="text-gray-400">{finding.region}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Risk Score: </span>
                      <span className={`font-bold ${finding.riskScore >= 90 ? 'text-red-400' : finding.riskScore >= 70 ? 'text-orange-400' : 'text-yellow-400'}`}>
                        {finding.riskScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-500/5 border border-green-500/20 rounded p-2 mb-2">
                    <span className="text-green-400 text-xs font-medium">Remediation: </span>
                    <span className="text-gray-400 text-xs">{finding.recommendation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    {finding.compliance.map(c => (
                      <span key={c} className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">{c}</span>
                    ))}
                  </div>
                </div>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
