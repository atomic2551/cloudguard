'use client';

import { useState } from 'react';
import { Server, Shield, CheckCircle2, AlertTriangle, RefreshCw, Activity, Terminal, Lock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

interface HostAgent {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  version: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastHeartbeat: string;
  mtlsFingerprint: string;
  modules: {
    processMon: boolean;
    fim: boolean;
    networkSniffer: boolean;
  };
  events24h: number;
}

const mockAgents: HostAgent[] = [
  {
    id: 'agent-dc-01',
    hostname: 'lab-dc01.local',
    ip: '192.168.1.10',
    os: 'Linux Ubuntu 24.04 LTS (x86_64)',
    version: 'SecLab-Agent v1.4.2',
    status: 'ONLINE',
    lastHeartbeat: 'Just now',
    mtlsFingerprint: 'SHA256:4a8b...99f1 (Valid Client Cert)',
    modules: { processMon: true, fim: true, networkSniffer: true },
    events24h: 1420,
  },
  {
    id: 'agent-ws-01',
    hostname: 'analyst-desktop.local',
    ip: '192.168.1.45',
    os: 'Windows 11 Enterprise (build 26100)',
    version: 'SecLab-Agent v1.4.2',
    status: 'ONLINE',
    lastHeartbeat: '12s ago',
    mtlsFingerprint: 'SHA256:7c3e...12a4 (Valid Client Cert)',
    modules: { processMon: true, fim: true, networkSniffer: false },
    events24h: 890,
  },
  {
    id: 'agent-app-02',
    hostname: 'staging-k8s-node01',
    ip: '192.168.1.88',
    os: 'Alpine Linux 3.20',
    version: 'SecLab-Agent v1.4.1',
    status: 'DEGRADED',
    lastHeartbeat: '2m ago',
    mtlsFingerprint: 'SHA256:91b2...ef55 (Valid Client Cert)',
    modules: { processMon: true, fim: false, networkSniffer: true },
    events24h: 312,
  },
];

export default function HostsAgentsPage() {
  const [agents, setAgents] = useState(mockAgents);
  const [syncing, setSyncing] = useState(false);

  const handleRefresh = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 800);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Connected Host Sensors & mTLS Agents</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Lightweight endpoint agents collecting process executions, FIM SHA-256 hashes, and packet telemetry
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={syncing}
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Query Agents
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Server className="w-4 h-4 text-blue-400" /> Total Registered Hosts
            </div>
            <div className="text-2xl font-bold text-white">{agents.length}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> Healthy mTLS Sessions
            </div>
            <div className="text-2xl font-bold text-green-400">
              {agents.filter((a) => a.status === 'ONLINE').length}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Shield className="w-4 h-4 text-purple-400" /> Active FIM Baselines
            </div>
            <div className="text-2xl font-bold text-purple-400">2 Hosts</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Activity className="w-4 h-4 text-cyan-400" /> Total Ingested Events (24h)
            </div>
            <div className="text-2xl font-bold text-cyan-400">2,622</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-gray-200 text-sm font-semibold">Registered Host Agents (mTLS Verified)</h2>
            <span className="text-xs text-green-400 font-mono flex items-center gap-1">
              <Lock className="w-3 h-3" /> TLS 1.3 Client Authentication Active
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Hostname & ID</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32">IP Address</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Operating System</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-48">Active Sensors</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32">Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-gray-200 text-sm font-medium font-mono">{agent.hostname}</div>
                    <div className="text-gray-500 text-xs font-mono">{agent.id} · {agent.mtlsFingerprint}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-400">{agent.ip}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">{agent.os}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${agent.modules.processMon ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                        Process
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${agent.modules.fim ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                        FIM
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${agent.modules.networkSniffer ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                        Sniffer
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                      agent.status === 'ONLINE'
                        ? 'bg-green-500/15 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{agent.lastHeartbeat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
