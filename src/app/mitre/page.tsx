'use client';

import { useState } from 'react';
import { Shield, Zap, Search, ExternalLink, Info } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  detectedCount: number;
  rulesCount: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const tactics = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Exfiltration',
];

const techniques: MitreTechnique[] = [
  { id: 'T1190', name: 'Exploit Public-Facing App', tactic: 'Initial Access', detectedCount: 1, rulesCount: 2, severity: 'HIGH' },
  { id: 'T1059', name: 'Command & Scripting Interpreter', tactic: 'Execution', detectedCount: 3, rulesCount: 3, severity: 'HIGH' },
  { id: 'T1098', name: 'Account Manipulation', tactic: 'Persistence', detectedCount: 4, rulesCount: 2, severity: 'CRITICAL' },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Persistence', detectedCount: 2, rulesCount: 2, severity: 'MEDIUM' },
  { id: 'T1548', name: 'Abuse Elevation Control', tactic: 'Privilege Escalation', detectedCount: 2, rulesCount: 1, severity: 'CRITICAL' },
  { id: 'T1562', name: 'Impair Defenses (StopLogging)', tactic: 'Defense Evasion', detectedCount: 1, rulesCount: 1, severity: 'CRITICAL' },
  { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', detectedCount: 14, rulesCount: 2, severity: 'HIGH' },
  { id: 'T1046', name: 'Network Service Discovery', tactic: 'Discovery', detectedCount: 8, rulesCount: 2, severity: 'HIGH' },
  { id: 'T1087', name: 'Account Discovery', tactic: 'Discovery', detectedCount: 4, rulesCount: 1, severity: 'MEDIUM' },
  { id: 'T1021', name: 'Remote Services (SSH/RDP)', tactic: 'Lateral Movement', detectedCount: 2, rulesCount: 1, severity: 'HIGH' },
  { id: 'T1048', name: 'Exfiltration Over Alt Protocol', tactic: 'Exfiltration', detectedCount: 1, rulesCount: 1, severity: 'HIGH' },
  { id: 'T1557', name: 'Adversary-in-the-Middle (ARP)', tactic: 'Credential Access', detectedCount: 1, rulesCount: 1, severity: 'HIGH' },
];

export default function MitreHeatmapPage() {
  const [selectedTactic, setSelectedTactic] = useState<string>('ALL');

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">MITRE ATT&CK® Enterprise Heatmap & Coverage</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Tactics, techniques, and procedures (TTPs) mapped to active Sigma rules and triggered alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-md font-mono">
              Detection Coverage: 78.5%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-400 font-medium">Activity Heatmap:</span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-3 h-3 rounded bg-red-500"></span> High Activity (Alerts &gt; 5)
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-3 h-3 rounded bg-orange-500"></span> Moderate (Alerts 2–5)
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-3 h-3 rounded bg-blue-500"></span> Detected (&gt; 0)
            </span>
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="w-3 h-3 rounded bg-gray-800 border border-gray-700"></span> Rule Mapped (0 Triggered)
            </span>
          </div>
          <div className="text-gray-500">MITRE ATT&CK v15 Matrix</div>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {tactics.map((tactic) => {
            const tacticTechs = techniques.filter((t) => t.tactic === tactic);
            return (
              <div key={tactic} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex flex-col">
                <div className="border-b border-gray-800 pb-2 mb-2">
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">{tactic}</h3>
                  <span className="text-[11px] text-gray-500">{tacticTechs.length} techniques</span>
                </div>
                <div className="space-y-2 flex-1">
                  {tacticTechs.length === 0 ? (
                    <div className="text-[11px] text-gray-600 italic py-2">No active rules</div>
                  ) : (
                    tacticTechs.map((tech) => {
                      const heatBg =
                        tech.detectedCount >= 5
                          ? 'bg-red-500/20 border-red-500/40 text-red-300'
                          : tech.detectedCount >= 2
                          ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                          : 'bg-blue-500/20 border-blue-500/40 text-blue-300';

                      return (
                        <div
                          key={tech.id}
                          className={`border rounded p-2 text-xs transition-colors hover:brightness-125 ${heatBg}`}
                        >
                          <div className="flex items-center justify-between mb-1 font-mono text-[10px]">
                            <span className="font-bold">{tech.id}</span>
                            <span className="opacity-80">{tech.detectedCount} hits</span>
                          </div>
                          <div className="text-xs font-medium line-clamp-1">{tech.name}</div>
                          <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-white/10 opacity-70">
                            <span>{tech.rulesCount} Sigma rules</span>
                            <a
                              href={`https://attack.mitre.org/techniques/${tech.id.replace('.', '/')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-0.5"
                            >
                              Docs <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
