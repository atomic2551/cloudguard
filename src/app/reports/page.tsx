'use client';

import { useState } from 'react';
import { FileText, Download, RefreshCw, BarChart3, Shield, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { mockAlerts, mockIncidents, mockFindings, categoryScores, alertsTrendData, severityDistribution } from '@/lib/mock-data';

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setReportGenerated(true);
    }, 2000);
  };

  const stats = {
    totalAlerts: mockAlerts.length,
    criticalAlerts: mockAlerts.filter(a => a.severity === 'CRITICAL').length,
    highAlerts: mockAlerts.filter(a => a.severity === 'HIGH').length,
    resolvedAlerts: mockAlerts.filter(a => a.status === 'RESOLVED' || a.status === 'FALSE_POSITIVE').length,
    openIncidents: mockIncidents.filter(i => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length,
    resolvedIncidents: mockIncidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length,
    criticalFindings: mockFindings.filter(f => f.severity === 'CRITICAL').length,
    openFindings: mockFindings.filter(f => f.status === 'OPEN').length,
  };

  const overallScore = 82;

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Security Reports</h1>
            <p className="text-gray-500 text-sm mt-0.5">Weekly security summary — Jan 9–15, 2024</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generateReport}
              disabled={generating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm px-4 py-2 rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
            <button className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {reportGenerated && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">Report generated successfully — ready to export</span>
          </div>
        )}

        {/* Overall security posture */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-gray-200 text-base font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Security Posture Summary
          </h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-400 mb-1">{overallScore}</div>
              <div className="text-gray-500 text-sm">Overall Score</div>
              <div className="text-gray-600 text-xs mt-1">/100</div>
            </div>
            <div className="col-span-4 grid grid-cols-2 gap-4">
              {Object.entries({
                IAM: categoryScores.iam,
                Network: categoryScores.network,
                Storage: categoryScores.storage,
                Logging: categoryScores.logging,
                Compute: categoryScores.compute,
              }).map(([cat, score]) => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-gray-400 text-sm">{cat} Security</span>
                    <span className={`text-sm font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {score}/100
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${score}%` }}
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
              Alert Summary
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Total Alerts', value: stats.totalAlerts, color: 'text-gray-300' },
                { label: 'Critical', value: stats.criticalAlerts, color: 'text-red-400' },
                { label: 'High', value: stats.highAlerts, color: 'text-orange-400' },
                { label: 'Resolved', value: stats.resolvedAlerts, color: 'text-green-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-gray-600 text-xs">{label}</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={alertsTrendData}>
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
              Severity Distribution
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {severityDistribution.map((item) => (
                <div key={item.name} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-gray-600 text-xs">{item.name} Alerts</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={severityDistribution} cx="50%" cy="50%" outerRadius={55} dataKey="value">
                  {severityDistribution.map((entry, index) => (
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
                { label: 'Total Incidents', value: mockIncidents.length, color: 'text-gray-300' },
                { label: 'Open', value: stats.openIncidents, color: 'text-red-400' },
                { label: 'Investigating', value: mockIncidents.filter(i => i.status === 'INVESTIGATING').length, color: 'text-yellow-400' },
                { label: 'Resolved', value: stats.resolvedIncidents, color: 'text-green-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-gray-600 text-xs">{label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {mockIncidents.slice(0, 3).map((inc) => (
                <div key={inc.id} className="flex items-center gap-2 text-xs py-1">
                  <SeverityBadge severity={inc.severity} size="xs" />
                  <span className="text-gray-400 flex-1 truncate">{inc.title}</span>
                  <span className="text-gray-600">{inc.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-gray-200 text-sm font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-yellow-400" />
              Security Findings
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Total Findings', value: mockFindings.length, color: 'text-gray-300' },
                { label: 'Critical', value: stats.criticalFindings, color: 'text-red-400' },
                { label: 'Open', value: stats.openFindings, color: 'text-orange-400' },
                { label: 'Remediated', value: mockFindings.filter(f => f.status === 'REMEDIATED').length, color: 'text-green-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-gray-600 text-xs">{label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {mockFindings.filter(f => f.status === 'OPEN').slice(0, 3).map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-xs py-1">
                  <SeverityBadge severity={f.severity} size="xs" />
                  <span className="text-gray-400 flex-1 truncate">{f.title}</span>
                  <span className="text-gray-600">{f.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-gray-200 text-sm font-semibold mb-4">Top Security Recommendations</h2>
          <div className="space-y-3">
            {[
              { priority: 'CRITICAL', text: 'Immediately disable IAM user backdoor-svc and audit all actions performed', effort: 'Low' },
              { priority: 'CRITICAL', text: 'Remove public internet access to PostgreSQL port 5432 in Security Group sg-database-prod', effort: 'Low' },
              { priority: 'HIGH', text: 'Enable MFA for all IAM users with console access (3 users currently without MFA)', effort: 'Low' },
              { priority: 'HIGH', text: 'Remove public ACL from S3 bucket acme-prod-backups-2024', effort: 'Low' },
              { priority: 'HIGH', text: 'Rotate IAM access key for maria.santos (120 days old)', effort: 'Low' },
              { priority: 'MEDIUM', text: 'Enable CloudTrail in all AWS regions including eu-central-1 and ap-southeast-2', effort: 'Medium' },
            ].map(({ priority, text, effort }, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-gray-800/40 rounded-lg px-3 py-2.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border mt-0.5 ${
                  priority === 'CRITICAL' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                  priority === 'HIGH' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
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
