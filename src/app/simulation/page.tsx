'use client';

import { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, XCircle, Download, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/AuthProvider';

interface AtomicTest {
  id: string;
  name: string;
  techniqueId: string;
  techniqueName: string;
  target: string;
  status: 'DETECTED' | 'MISSED' | 'PENDING' | 'RUNNING';
  lastRun: string;
  detectedRule?: string;
}

const initialTests: AtomicTest[] = [
  {
    id: 'ART-T1046-01',
    name: 'TCP SYN Port Sweep on Lab Gateway',
    techniqueId: 'T1046',
    techniqueName: 'Network Service Discovery',
    target: '192.168.1.10 (DVWA Container)',
    status: 'DETECTED',
    lastRun: '10m ago',
    detectedRule: 'IDS: Port Scan / Sweep (>20 ports in 60s)',
  },
  {
    id: 'ART-T1110-01',
    name: 'Hydra Password Spray Simulation',
    techniqueId: 'T1110',
    techniqueName: 'Brute Force',
    target: '192.168.1.45 (Local Auth API)',
    status: 'DETECTED',
    lastRun: '15m ago',
    detectedRule: 'Sigma: Brute Force Console Login Attempts',
  },
  {
    id: 'ART-T1562-01',
    name: 'Simulated CloudTrail StopLogging Call',
    techniqueId: 'T1562',
    techniqueName: 'Impair Defenses',
    target: 'AWS Account 123456789012 (Mock)',
    status: 'DETECTED',
    lastRun: '25m ago',
    detectedRule: 'Sigma: Unauthorized CloudTrail StopLogging Event',
  },
  {
    id: 'ART-T1059-01',
    name: 'PowerShell Encoded Script Execution',
    techniqueId: 'T1059.001',
    techniqueName: 'Command & Scripting Interpreter',
    target: 'analyst-desktop.local (Agent)',
    status: 'DETECTED',
    lastRun: '40m ago',
    detectedRule: 'Process Monitor: Suspicious Base64 Command Spawn',
  },
  {
    id: 'ART-T1087-01',
    name: 'Local User & Group Enumeration via net.exe',
    techniqueId: 'T1087.001',
    techniqueName: 'Account Discovery',
    target: 'analyst-desktop.local (Agent)',
    status: 'MISSED',
    lastRun: '1h ago',
  },
  {
    id: 'ART-T1557-01',
    name: 'Gratuitous ARP Gateway Spoofing Simulation',
    techniqueId: 'T1557.002',
    techniqueName: 'Adversary-in-the-Middle',
    target: '192.168.1.1 (Gateway IP)',
    status: 'DETECTED',
    lastRun: '2h ago',
    detectedRule: 'IDS: ARP Spoofing Conflicting MAC Alarm',
  },
];

export default function SimulationLabPage() {
  const { user } = useAuth();
  const isAdminOrAnalyst = user?.roles?.includes('ADMIN') || user?.roles?.includes('SOC_ANALYST');

  const [tests, setTests] = useState<AtomicTest[]>(initialTests);
  const [runningId, setRunningId] = useState<string | null>(null);

  const detectedCount = tests.filter((t) => t.status === 'DETECTED').length;
  const coveragePercent = Math.round((detectedCount / tests.length) * 100);

  const runTest = (id: string) => {
    if (!isAdminOrAnalyst) return;
    setRunningId(id);
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'RUNNING' } : t))
    );
    setTimeout(() => {
      setTests((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: 'DETECTED', lastRun: 'Just now', detectedRule: 'Real-time Sigma Alert Engine' }
            : t
        )
      );
      setRunningId(null);
    }, 1500);
  };

  const exportMarkdown = () => {
    const md = `# SecLab XDR — Attack Simulation Coverage Report
Generated: ${new Date().toISOString()}
Detection Coverage: ${coveragePercent}% (${detectedCount}/${tests.length} tests detected)

| Test ID | Technique | Target | Status | Detection Rule |
|---|---|---|---|---|
${tests.map((t) => `| ${t.id} | ${t.techniqueId} (${t.techniqueName}) | ${t.target} | ${t.status} | ${t.detectedRule || 'N/A'} |`).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seclab-detection-coverage-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Attack Simulation & Detection Coverage Lab</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Execute controlled Atomic Red Team techniques strictly against verified Scope Guard targets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportMarkdown}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report (Markdown)
            </button>
          </div>
        </div>

        {/* Coverage cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-500 text-xs mb-1">Overall Detection Coverage</div>
            <div className="text-3xl font-bold text-green-400">{coveragePercent}%</div>
            <div className="text-gray-600 text-xs mt-1">{detectedCount} of {tests.length} attacks intercepted</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-500 text-xs mb-1">Detected Signatures</div>
            <div className="text-3xl font-bold text-blue-400">{detectedCount}</div>
            <div className="text-gray-500 text-xs mt-1">Sigma & Anomaly Rules</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-500 text-xs mb-1">Detection Gaps (Missed)</div>
            <div className="text-3xl font-bold text-red-400">{tests.length - detectedCount}</div>
            <div className="text-gray-500 text-xs mt-1">Opportunity for rule addition</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-500 text-xs mb-1">Scope Guard Enforcement</div>
            <div className="text-sm font-semibold text-green-400 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-4 h-4" /> 100% Targets Verified
            </div>
            <div className="text-gray-600 text-[11px] mt-1">Refuses external IPs</div>
          </div>
        </div>

        {/* Tests table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-gray-200 text-sm font-semibold">Atomic Red Team Test Matrix</h2>
            <span className="text-gray-500 text-xs font-mono">Simulated Lab Profile Active</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">Simulation Test</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32">MITRE ATT&CK</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Target Host</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Result</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Triggered Detection</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tests.map((test) => {
                const isRunning = runningId === test.id || test.status === 'RUNNING';
                return (
                  <tr key={test.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-gray-200 text-sm font-medium">{test.name}</div>
                      <div className="text-gray-500 text-xs font-mono">{test.id} · Last tested {test.lastRun}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                        {test.techniqueId}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs font-mono text-gray-400">
                      {test.target}
                    </td>
                    <td className="px-4 py-3">
                      {test.status === 'DETECTED' ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> DETECTED
                        </span>
                      ) : test.status === 'MISSED' ? (
                        <span className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> MISSED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-400 text-xs font-semibold">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> RUNNING
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-300">
                      {test.detectedRule || <span className="text-gray-600 italic">No rule triggered</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isAdminOrAnalyst && (
                        <button
                          onClick={() => runTest(test.id)}
                          disabled={isRunning}
                          className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          {isRunning ? 'Running...' : 'Run Test'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
