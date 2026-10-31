'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, BarChart3, Shield, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { api, SecurityReportDto } from '@/lib/api';
import DemoDataBadge from '@/components/ui/DemoDataBadge';

const staticAlertsTrend = [
  { date: 'Oct 20', critical: 1, high: 2, medium: 3 },
  { date: 'Oct 21', critical: 2, high: 3, medium: 2 },
  { date: 'Oct 22', critical: 0, high: 1, medium: 4 },
  { date: 'Oct 23', critical: 3, high: 4, medium: 1 },
  { date: 'Oct 24', critical: 1, high: 2, medium: 3 },
  { date: 'Oct 25', critical: 4, high: 5, medium: 2 },
  { date: 'Oct 26', critical: 2, high: 3, medium: 4 },
];

const staticSeverityDistribution = [
  { name: 'Critical', value: 4, color: '#ef4444' },
  { name: 'High', value: 7, color: '#f97316' },
  { name: 'Medium', value: 12, color: '#eab308' },
  { name: 'Low', value: 18, color: '#22c55e' },
];

export default function ReportsPage() {
  const [report, setReport] = useState<SecurityReportDto | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    api.reports.getLatestReport()
      .then(setReport)
      .catch(() => null);
  }, []);

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setReportGenerated(true);
    }, 1500);
  };

  const overallScore = report?.overallScore ?? null;
  const categoryScores: Record<string, number | null> = report?.categoryScores ?? {
    IAM: null,
    Network: null,
    Storage: null,
    Logging: null,
    Compute: null,
  };

  const stats: Record<string, number | null> = report?.summary ?? {
    totalAlerts: null,
    resolvedAlerts: null,
    openIncidents: null,
    resolvedIncidents: null,
    criticalFindings: null,
    openFindings: null,
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Security & Compliance Reports</h1>
              <DemoDataBadge />
            </div>
            <p className="text-gray-500 text-sm mt-0.5">Automated security posture summary — SecLab XDR Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generateReport}
              disabled={generating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Compiling Report...' : 'Generate Fresh Report'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Brief
            </button>
          </div>
        </div>

        {reportGenerated && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">Security report compiled with latest telemetry and threat intelligence score.</span>
          </div>
        )}

        {/* Data unavailable */}
        {!report && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">Data unavailable — no report data loaded from backend. Values display dashes until data is available.</span>
          </div>
        )}

        {/* Overall security posture */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-gray-200 text-base font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Platform Security Posture Summary
          </h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-400 mb-1">{overallScore !== null ? overallScore : '—'}</div>
              <div className="text-gray-400 text-sm font-medium">Compliance Index</div>
              <div className="text-gray-600 text-xs mt-1">/100 Benchmark</div>
            </div>
            <div className="col-span-4 grid grid-cols-2 gap-4">
              {Object.entries(categoryScores).map(([cat, score]) => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-gray-400 text-sm">{cat} Security</span>
                    <span className={`text-sm font-bold ${score === null ? 'text-gray-600' : score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {score !== null ? `${score}/100` : '—'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${score === null ? 'bg-gray-700' : score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: score !== null ? `${score}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-gray-200 text-sm font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Alert Volume Trend
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Total Telemetry Alerts', value: stats.totalAlerts, color: 'text-gray-300' },
                { label: 'Resolved Operations', value: stats.resolvedAlerts, color: 'text-green-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                  <div className={`text-xl font-bold ${color}`}>{value ?? '—'}</div>
                  <div className="text-gray-600 text-xs">{label}</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={staticAlertsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
                <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-gray-200 text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Severity Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {staticSeverityDistribution.map((item) => (
                <div key={item.name} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-gray-600 text-xs">{item.name} Alerts</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={staticSeverityDistribution} cx="50%" cy="50%" outerRadius={55} dataKey="value">
                  {staticSeverityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident + Findings summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-gray-200 text-sm font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Incident Summary
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Active Incidents', value: stats.openIncidents, color: 'text-red-400' },
                { label: 'Resolved Incidents', value: stats.resolvedIncidents, color: 'text-green-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                  <div className={`text-xl font-bold ${color}`}>{value ?? '—'}</div>
                  <div className="text-gray-600 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-gray-200 text-sm font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-yellow-400" />
              Security Scanner Findings
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Open Findings', value: stats.openFindings, color: 'text-orange-400' },
                { label: 'Critical Exposures', value: stats.criticalFindings, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                  <div className={`text-xl font-bold ${color}`}>{value ?? '—'}</div>
                  <div className="text-gray-600 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-gray-200 text-sm font-semibold mb-4">Executive Mitigation Roadmap</h2>
          <div className="space-y-3">
            {[
              { priority: 'CRITICAL', text: 'Revoke AdministratorAccess policy directly attached to user backdoor-svc', effort: 'Low' },
              { priority: 'CRITICAL', text: 'Restrict PostgreSQL port 5432 ingress rule open to 0.0.0.0/0 on sg-database-prod', effort: 'Low' },
              { priority: 'HIGH', text: 'Enable mandatory MFA for all console IAM users (3 identified non-compliant)', effort: 'Low' },
              { priority: 'HIGH', text: 'Block public read access on S3 bucket acme-prod-backups-2024', effort: 'Low' },
            ].map(({ priority, text, effort }, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-gray-800/40 rounded-lg px-3 py-2.5 border border-gray-800">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border mt-0.5 ${
                  priority === 'CRITICAL' ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                }`}>{priority}</span>
                <span className="text-gray-300 text-sm flex-1">{text}</span>
                <span className="text-gray-600 text-xs bg-gray-800 px-2 py-0.5 rounded">Effort: {effort}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
