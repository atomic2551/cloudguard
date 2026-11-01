'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import DemoDataBadge from '@/components/ui/DemoDataBadge';
import { Severity } from '@/lib/api';

interface NetworkEvent {
  id: string;
  timestamp: string;
  type: string;
  sourceIp: string;
  destIp: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'ARP' | 'ICMP';
  severity: Severity;
  signature: string;
  mitreId: string;
}

// Stable fixed timestamps to prevent SSR vs client hydration mismatches
const mockNetworkEvents: NetworkEvent[] = [
  {
    id: 'net-ev-101',
    timestamp: '2026-10-31T08:15:00Z',
    type: 'PORT_SCAN_DETECTED',
    sourceIp: '192.168.1.105',
    destIp: '192.168.1.10',
    port: 445,
    protocol: 'TCP',
    severity: 'CRITICAL',
    signature: 'IDS: SYN Sweep (> 25 ports scanned in 30s)',
    mitreId: 'T1046',
  },
  {
    id: 'net-ev-102',
    timestamp: '2026-10-31T08:10:00Z',
    type: 'ARP_SPOOF_ANOMALY',
    sourceIp: '192.168.1.199',
    destIp: '192.168.1.1',
    port: 0,
    protocol: 'ARP',
    severity: 'HIGH',
    signature: 'IDS: Conflicting MAC address claiming default gateway IP',
    mitreId: 'T1557.002',
  },
  {
    id: 'net-ev-103',
    timestamp: '2026-10-31T07:50:00Z',
    type: 'TRAFFIC_SPIKE_ANOMALY',
    sourceIp: '192.168.1.45',
    destIp: '54.210.12.44',
    port: 443,
    protocol: 'TCP',
    severity: 'MEDIUM',
    signature: 'IsolationForest: Egress volume 4.8x baseline threshold',
    mitreId: 'T1048',
  },
];

export default function NetworkIDSPage() {
  const [events] = useState<NetworkEvent[]>(mockNetworkEvents);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const criticalAlarms = events.filter((e) => e.severity === 'CRITICAL').length;
  const highAnomalies = events.filter((e) => e.severity === 'HIGH').length;

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Network Intrusion Detection & Traffic Analyzer</h1>
              <DemoDataBadge tooltip="Simulated Scapy sniffer telemetry" />
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
              Live Scapy sniffer stream, ARP poisoning guards, and statistical traffic spike detection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-1.5 text-green-400 text-xs font-medium">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Sniffer Interface: eth0
            </span>
          </div>
        </div>

        {/* Demo banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-400 flex items-center justify-between">
          <span>Demonstration sensor mode active: Packet stream events below are simulated for demonstration.</span>
          <span className="font-mono text-[11px] opacity-80">SCOPE: 192.168.1.0/24</span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Packet Ingestion Rate</div>
            <div className="text-2xl font-bold text-white">—</div>
            <div className="text-gray-500 text-xs mt-1">Simulated Baseline</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Port Scan Alarms</div>
            <div className="text-2xl font-bold text-red-400">{criticalAlarms} Critical</div>
            <div className="text-gray-500 text-xs mt-1">T1046 Network Service Discovery</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">ARP Poisoning Guards</div>
            <div className="text-2xl font-bold text-yellow-400">{highAnomalies} Anomaly</div>
            <div className="text-gray-500 text-xs mt-1">Gateway IP Protected</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Anomaly Engine (IsolationForest)</div>
            <div className="text-2xl font-bold text-cyan-400">Trained</div>
            <div className="text-gray-500 text-xs mt-1">Egress Outliers Flagged</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-gray-200 text-sm font-semibold">Network Signatures & Packet Alerts</h2>
            <span className="text-gray-400 text-xs font-mono">Scope Guard: 192.168.1.0/24 only</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Severity</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Signature & Indicator</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36">Source IP</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36">Destination</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Protocol</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">MITRE ID</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <SeverityBadge severity={ev.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-200 text-sm font-medium">{ev.type.replace(/_/g, ' ')}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{ev.signature}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-red-400 font-semibold">{ev.sourceIp}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-300">
                    {ev.destIp}{ev.port > 0 ? `:${ev.port}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-400 border border-gray-700">
                      {ev.protocol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                      {ev.mitreId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400" suppressHydrationWarning>
                    {mounted ? new Date(ev.timestamp).toLocaleTimeString() : '08:15:00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
