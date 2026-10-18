'use client';

import { useState } from 'react';
import { Shield, ToggleLeft, ToggleRight, Search, Clock, AlertTriangle, Zap } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { mockDetectionRules } from '@/lib/mock-data';

const categoryColors: Record<string, string> = {
  BRUTE_FORCE: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  PRIVILEGE_ESCALATION: 'bg-red-500/10 text-red-400 border-red-500/30',
  NETWORK_EXPOSURE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  DATA_EXPOSURE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  PRIVILEGE_ABUSE: 'bg-red-500/10 text-red-400 border-red-500/30',
  DEFENSE_EVASION: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  SUSPICIOUS_IAM: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  CREDENTIAL_HYGIENE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  ANOMALY: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  CONFIGURATION_WEAKNESS: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export default function DetectionRulesPage() {
  const [rules, setRules] = useState(mockDetectionRules);
  const [search, setSearch] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const filtered = rules.filter((r) => {
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.mitreId.toLowerCase().includes(search.toLowerCase());
    const matchEnabled = filterEnabled === 'ALL' || (filterEnabled === 'ENABLED' ? r.enabled : !r.enabled);
    const matchSeverity = filterSeverity === 'ALL' || r.severity === filterSeverity;
    return matchSearch && matchEnabled && matchSeverity;
  });

  const enabled = rules.filter(r => r.enabled).length;
  const totalAlerts = rules.reduce((sum, r) => sum + r.alertCount, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Detection Rules</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {enabled} active · {rules.length - enabled} disabled · {totalAlerts} total alerts triggered
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active Rules', value: enabled, color: 'text-green-400', icon: Shield },
            { label: 'Disabled Rules', value: rules.length - enabled, color: 'text-gray-400', icon: Shield },
            { label: 'Alerts This Month', value: totalAlerts, color: 'text-orange-400', icon: AlertTriangle },
            { label: 'MITRE Techniques', value: new Set(rules.map(r => r.mitreId)).size, color: 'text-blue-400', icon: Zap },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-gray-500 text-xs">{label}</span>
              </div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <select value={filterEnabled} onChange={(e) => setFilterEnabled(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
            <option value="ALL">All Status</option>
            <option value="ENABLED">Enabled</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
            <option value="ALL">All Severities</option>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} rules</span>
        </div>

        {/* Rules list */}
        <div className="space-y-3">
          {filtered.map((rule) => (
            <div
              key={rule.id}
              className={`bg-gray-900 border rounded-lg p-4 transition-colors hover:border-gray-700 ${
                rule.enabled ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Toggle */}
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="mt-0.5 flex-shrink-0"
                  title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-400 hover:text-green-300 transition-colors" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-600 hover:text-gray-400 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <SeverityBadge severity={rule.severity} />
                    <span className={`text-xs border rounded px-2 py-0.5 ${categoryColors[rule.category] ?? 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {rule.category.replace('_', ' ')}
                    </span>
                    <span className="bg-gray-800 text-gray-500 text-xs border border-gray-700 rounded px-2 py-0.5 font-mono">
                      {rule.mitreId}
                    </span>
                    <span className="text-gray-600 text-xs">{rule.mitreTactic}</span>
                    <span className="ml-auto text-gray-600 text-xs font-mono">{rule.id}</span>
                  </div>

                  <h3 className="text-gray-200 text-sm font-semibold mb-1">{rule.name}</h3>
                  <p className="text-gray-500 text-xs mb-3">{rule.description}</p>

                  <div className="bg-gray-800/60 rounded-lg p-2.5 mb-3">
                    <div className="text-gray-500 text-xs font-medium mb-1">Trigger Condition</div>
                    <div className="text-gray-300 text-xs font-mono">{rule.trigger}</div>
                    {rule.threshold && (
                      <div className="text-gray-600 text-xs mt-1">
                        Threshold: <span className="text-yellow-400">{rule.threshold}</span>
                        {rule.timeWindow && <> · Window: <span className="text-yellow-400">{rule.timeWindow}</span></>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-orange-400" />
                      <span className="text-orange-400 font-medium">{rule.alertCount}</span>
                      <span>alerts triggered</span>
                    </div>
                    {rule.lastTriggered && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last: {new Date(rule.lastTriggered).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                      <span className={rule.enabled ? 'text-green-400' : 'text-gray-600'}>
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
