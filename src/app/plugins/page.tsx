'use client';

import { useState } from 'react';
import { Cpu, Power, Activity, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/AuthProvider';

interface PluginState {
  id: string;
  name: string;
  category: 'Network' | 'Host' | 'Web' | 'Crypto' | 'Cloud';
  description: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR';
  eventsEmitted: number;
  lastActive: string;
}

const initialPlugins: PluginState[] = [
  { id: 'plugin-net-scanner', name: 'Network Scanner', category: 'Network', description: 'Port and service discovery within scope.yaml CIDR targets', status: 'RUNNING', eventsEmitted: 412, lastActive: '1m ago' },
  { id: 'plugin-traffic-analyzer', name: 'Traffic Analyzer', category: 'Network', description: 'Scapy live packet stream & anomaly statistical baseline', status: 'RUNNING', eventsEmitted: 1240, lastActive: 'Just now' },
  { id: 'plugin-web-checker', name: 'Web Security Checker', category: 'Web', description: 'Reflected input and missing header auditor (DVWA/Juice Shop)', status: 'RUNNING', eventsEmitted: 89, lastActive: '5m ago' },
  { id: 'plugin-firewall-sim', name: 'Firewall Simulator', category: 'Network', description: 'Rule-based packet filter and drop reasons inspector', status: 'RUNNING', eventsEmitted: 320, lastActive: '3m ago' },
  { id: 'plugin-pw-lab', name: 'Password Strength Lab', category: 'Crypto', description: 'Entropy and resistance testing against test wordlists', status: 'STOPPED', eventsEmitted: 45, lastActive: '1h ago' },
  { id: 'plugin-proc-mon', name: 'Process Monitor', category: 'Host', description: 'psutil abnormal parent-child & unsigned binary monitor', status: 'RUNNING', eventsEmitted: 890, lastActive: 'Just now' },
  { id: 'plugin-phishing', name: 'Phishing Analyzer', category: 'Web', description: 'scikit-learn lookalike domain and certificate scoring', status: 'RUNNING', eventsEmitted: 64, lastActive: '12m ago' },
  { id: 'plugin-ids', name: 'IDS Dashboard Engine', category: 'Network', description: 'Scan patterns, SYN sweep (>20 ports in 60s) alarms', status: 'RUNNING', eventsEmitted: 198, lastActive: 'Just now' },
  { id: 'plugin-fim', name: 'File Integrity Monitor', category: 'Host', description: 'Watchdog SHA-256 timestamped filesystem change tracker', status: 'RUNNING', eventsEmitted: 523, lastActive: 'Just now' },
  { id: 'plugin-messenger', name: 'Encrypted Messenger', category: 'Crypto', description: 'PyNaCl E2E WebSocket secure operational chat', status: 'RUNNING', eventsEmitted: 14, lastActive: '2h ago' },
  { id: 'plugin-cloud-scanner', name: 'CloudGuard Cloud Scanner', category: 'Cloud', description: 'boto3 read-only SecurityGroup, S3, IAM, CloudTrail auditor', status: 'RUNNING', eventsEmitted: 742, lastActive: 'Just now' },
];

export default function PluginsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [plugins, setPlugins] = useState<PluginState[]>(initialPlugins);

  const togglePlugin = (id: string) => {
    if (!isAdmin) {
      window.alert('Only ADMIN role can toggle platform security plugins.');
      return;
    }
    setPlugins((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'RUNNING' ? 'STOPPED' : 'RUNNING' }
          : p
      )
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Plugin Architecture & Sensor Controls</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              10 unified defensive modules implementing start(), stop(), status(), emit(Event) via Redis Event Bus
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              {plugins.filter((p) => p.status === 'RUNNING').length} Active / {plugins.length} Total
            </span>
          </div>
        </div>

        {/* Plugin grid */}
        <div className="grid grid-cols-2 gap-4">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className={`bg-gray-900 border rounded-lg p-4 transition-colors ${
                plugin.status === 'RUNNING' ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold text-sm">{plugin.name}</h3>
                  <span className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded">
                    {plugin.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                    plugin.status === 'RUNNING'
                      ? 'bg-green-500/15 text-green-400 border-green-500/30'
                      : 'bg-gray-800 text-gray-500 border-gray-700'
                  }`}>
                    {plugin.status}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => togglePlugin(plugin.id)}
                      className={`p-1.5 rounded-md border transition-colors ${
                        plugin.status === 'RUNNING'
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                          : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      }`}
                      title={plugin.status === 'RUNNING' ? 'Stop plugin' : 'Start plugin'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-gray-400 text-xs mb-3">{plugin.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-2.5">
                <span className="flex items-center gap-1 font-mono">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  {plugin.eventsEmitted} events emitted
                </span>
                <span>Active: {plugin.lastActive}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
