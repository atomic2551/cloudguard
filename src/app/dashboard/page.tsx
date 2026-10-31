'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, DashboardSummaryDto, AlertDto, SecurityEventDto, Severity } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Shield, AlertTriangle, Bell, Layers, Search,
  TrendingUp, TrendingDown, Activity, Clock, ArrowRight,
  CheckCircle2, Wifi, Loader2
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import DemoDataBadge from '@/components/ui/DemoDataBadge';

// Local chart defaults (eliminating mock-data dependency)
const staticIncidentsByCategory = [
  { category: 'Privilege Escalation', count: 3 },
  { category: 'Credential Access', count: 4 },
  { category: 'Data Exfiltration', count: 1 },
  { category: 'Persistence', count: 2 },
  { category: 'Defense Evasion', count: 2 },
];

const staticSecurityScoreHistory = [
  { date: 'Mon', score: 78 },
  { date: 'Tue', score: 79 },
  { date: 'Wed', score: 81 },
  { date: 'Thu', score: 80 },
  { date: 'Fri', score: 82 },
  { date: 'Sat', score: 82 },
  { date: 'Sun', score: 84 },
];

function MetricCard({
  label, value, sub, icon: Icon, iconColor, trend, trendLabel, href
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string;
  href?: string;
}) {
  const content = (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-gray-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {trendLabel}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</div>
      {sub && <div className="text-gray-600 text-xs mt-1">{sub}</div>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function SecurityScoreRing({ score, categories }: { score: number | null; categories?: Record<string, number> }) {
  const hasScore = score !== null && score !== undefined;
  const displayScore = hasScore ? score : 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (displayScore / 100) * circumference;
  const color = !hasScore ? '#4b5563' : score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

  const defaultCats: Record<string, number | null> = {
    IAM: categories?.iam ?? null,
    Network: categories?.network ?? null,
    Storage: categories?.storage ?? null,
    Logging: categories?.logging ?? null,
    Compute: categories?.compute ?? null,
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 col-span-1">
      <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Cloud Security Score</div>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="#1f2937" strokeWidth="12" />
            <circle
              cx="64" cy="64" r="54" fill="none"
              stroke={color} strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{hasScore ? score : '—'}</span>
            <span className="text-gray-500 text-xs">/100</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {Object.entries(defaultCats).map(([cat, val]) => (
            <div key={cat}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-xs">{cat}</span>
                <span className={`text-xs font-bold ${val === null ? 'text-gray-600' : val >= 80 ? 'text-green-400' : val >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {val !== null ? `${val}%` : '—'}
                </span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${val === null ? 'bg-gray-700' : val >= 80 ? 'bg-green-500' : val >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: val !== null ? `${val}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (cx == null || cy == null || midAngle == null || innerRadius == null || outerRadius == null || percent == null) return null;
  const cxN = Number(cx), cyN = Number(cy), midAngleN = Number(midAngle);
  const innerR = Number(innerRadius), outerR = Number(outerRadius);
  const radius = innerR + (outerR - innerR) * 0.5;
  const x = cxN + radius * Math.cos(-midAngleN * RADIAN);
  const y = cyN + radius * Math.sin(-midAngleN * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(Number(percent) * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertDto[]>([]);
  const [recentEvents, setRecentEvents] = useState<SecurityEventDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [sum, alts, evts] = await Promise.all([
          api.dashboard.getSummary().catch(() => null),
          api.alerts.list({ size: 6 }).catch(() => ({ items: [] })),
          api.events.list({ size: 6 }).catch(() => ({ items: [] })),
        ]);
        setSummary(sum);
        setRecentAlerts(alts?.items || []);
        setRecentEvents(evts?.items || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const criticalAlerts = summary?.metrics?.criticalAlerts ?? null;
  const highAlerts = summary?.metrics?.highAlerts ?? null;
  const openIncidents = summary?.metrics?.openIncidents ?? null;
  const securityScore = summary?.overallSecurityScore ?? null;

  const trendData = summary?.alertsTrend || [];
  const distribution = summary?.severityDistribution || [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Security Operations Dashboard</h1>
              <DemoDataBadge />
            </div>
            <p className="text-gray-500 text-sm mt-0.5">Real-time cloud & host security monitoring — SecLab XDR</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity className="w-3.5 h-3.5 text-green-400" />
            <span>Last sync: <span className="text-gray-400">Just now</span></span>
          </div>
        </div>

        {/* Data unavailable */}
        {!loading && !summary && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">Data unavailable — backend summary could not be loaded. Metrics display dashes until data is available.</span>
          </div>
        )}

        {/* Top metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SecurityScoreRing score={securityScore} categories={summary?.categoryScores} />
          <div className="grid grid-cols-2 col-span-1 lg:col-span-4 gap-4">
            <MetricCard
              label="Critical Alerts"
              value={criticalAlerts ?? '—'}
              icon={AlertTriangle}
              iconColor="bg-red-500/20 text-red-400"
              trend="up"
              trendLabel="+2 today"
              href="/alerts"
            />
            <MetricCard
              label="High Alerts"
              value={highAlerts ?? '—'}
              icon={Bell}
              iconColor="bg-orange-500/20 text-orange-400"
              trend="up"
              trendLabel="+3 today"
              href="/alerts"
            />
            <MetricCard
              label="Open Incidents"
              value={openIncidents ?? '—'}
              icon={Layers}
              iconColor="bg-purple-500/20 text-purple-400"
              trend="up"
              trendLabel="+1 today"
              href="/incidents"
            />
            <MetricCard
              label="Security Findings"
              value={summary?.metrics?.openFindings ?? '—'}
              sub="Security scanner findings"
              icon={Search}
              iconColor="bg-yellow-500/20 text-yellow-400"
              href="/findings"
            />
            <MetricCard
              label="Connected Hosts / Accounts"
              value={summary?.metrics?.activeCloudAccounts ?? '—'}
              sub="Monitored in scope.yaml"
              icon={Wifi}
              iconColor="bg-blue-500/20 text-blue-400"
              href="/cloud-accounts"
            />
            <MetricCard
              label="Total Alerts"
              value={summary?.metrics?.totalAlerts ?? '—'}
              sub="All telemetry sources"
              icon={Activity}
              iconColor="bg-cyan-500/20 text-cyan-400"
              href="/alerts"
            />
            <MetricCard
              label="Critical Findings"
              value={summary?.metrics?.criticalFindings ?? '—'}
              sub="Immediate remediation"
              icon={Shield}
              iconColor="bg-red-500/20 text-red-400"
              href="/findings"
            />
            <MetricCard
              label="Investigating Incidents"
              value={summary?.metrics?.investigatingIncidents ?? '—'}
              sub="Active triage"
              icon={CheckCircle2}
              iconColor="bg-teal-500/20 text-teal-400"
              href="/incidents"
            />
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Alerts over time */}
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-gray-200 text-sm font-semibold">Security Alerts — 7 Day Trend</h2>
                <p className="text-gray-600 text-xs mt-0.5">Alert volume by severity across all sources</p>
              </div>
              <Link href="/alerts" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Area type="monotone" dataKey="critical" stroke="#ef4444" fill="url(#critGrad)" strokeWidth={2} name="Critical" />
                <Area type="monotone" dataKey="high" stroke="#f97316" fill="url(#highGrad)" strokeWidth={2} name="High" />
                <Area type="monotone" dataKey="medium" stroke="#eab308" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Medium" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Severity distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-gray-200 text-sm font-semibold mb-1">Alert Distribution</h2>
            <p className="text-gray-600 text-xs mb-4">By severity level</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={70}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {distribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-400 text-xs">{item.name}</span>
                  </div>
                  <span className="text-gray-300 text-xs font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second row charts */}
        <div className="grid grid-cols-2 gap-4">
          {/* Incidents by category */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-gray-200 text-sm font-semibold">Incidents by Attack Category</h2>
                <p className="text-gray-600 text-xs mt-0.5">Correlated security incidents</p>
              </div>
              <Link href="/incidents" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={staticIncidentsByCategory} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Security score history */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-gray-200 text-sm font-semibold">Security Posture Score History</h2>
                <p className="text-gray-600 text-xs mt-0.5">Weekly compliance trend</p>
              </div>
              <span className="text-green-400 text-xs font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +6 pts
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={staticSecurityScoreHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 90]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 3 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom row: Recent events + active alerts */}
        <div className="grid grid-cols-3 gap-4">
          {/* Recent security events */}
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-gray-200 text-sm font-semibold">Live Security Pipeline Events</h2>
              <Link href="/events" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-800">
              {loading ? (
                <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Loading events stream...</span>
                </div>
              ) : recentEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No recent pipeline events</div>
              ) : (
                recentEvents.slice(0, 6).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-2 w-16 flex-shrink-0">
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-500 text-xs font-mono">
                        {new Date(event.eventTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-gray-200 text-xs font-medium">{event.eventType}</span>
                        <SeverityBadge severity={event.severity as Severity} size="xs" />
                      </div>
                      <div className="text-gray-500 text-xs flex items-center gap-2">
                        <span>IP: {event.sourceIp || 'Internal'}</span>
                        <span>·</span>
                        <span className="text-gray-400">{event.userIdentity || 'Service'}</span>
                        <span>·</span>
                        <span>{event.region || 'global'}</span>
                      </div>
                    </div>
                    <span className="text-gray-600 text-xs font-mono flex-shrink-0">{event.cloudAccountId?.slice(0, 8) || 'local'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active critical alerts */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-gray-200 text-sm font-semibold">Active Alerts</h2>
              <Link href="/alerts" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-800">
              {loading ? (
                <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Loading alerts...</span>
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No active alerts</div>
              ) : (
                recentAlerts.slice(0, 6).map((alert) => (
                  <Link key={alert.id} href={`/alerts/${alert.id}`}>
                    <div className="px-4 py-3 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-2 mb-1">
                        <SeverityBadge severity={alert.severity as Severity} size="xs" />
                        <span className="text-gray-500 text-xs font-mono">{alert.alertNumber || alert.id.slice(0, 8)}</span>
                      </div>
                      <div className="text-gray-300 text-xs font-medium mb-1 leading-tight">{alert.title}</div>
                      <div className="text-gray-500 text-xs">
                        {alert.sourceIp ? `IP: ${alert.sourceIp}` : alert.targetResource || 'Host'}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
