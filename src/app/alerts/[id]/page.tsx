'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Globe, User, Box, MapPin, Shield,
  CheckCircle2, AlertTriangle, Search, UserCheck, Plus,
  XCircle, MessageSquare, ExternalLink, ChevronDown
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockAlerts, type AlertStatus } from '@/lib/mock-data';

const STATUS_ACTIONS: { action: string; label: string; newStatus: AlertStatus; icon: React.ElementType; className: string }[] = [
  { action: 'acknowledge', label: 'Acknowledge', newStatus: 'ACKNOWLEDGED', icon: CheckCircle2, className: 'bg-purple-600 hover:bg-purple-700 text-white' },
  { action: 'investigate', label: 'Investigate', newStatus: 'INVESTIGATING', icon: Search, className: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
  { action: 'resolve', label: 'Resolve', newStatus: 'RESOLVED', icon: CheckCircle2, className: 'bg-green-600 hover:bg-green-700 text-white' },
  { action: 'false_positive', label: 'False Positive', newStatus: 'FALSE_POSITIVE', icon: XCircle, className: 'bg-gray-600 hover:bg-gray-700 text-white' },
];

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;

  const [alerts, setAlerts] = useState(mockAlerts);
  const [comment, setComment] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const alert = alerts.find((a) => a.id === alertId);

  if (!alert) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-gray-500 mt-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p>Alert not found: {alertId}</p>
          <Link href="/alerts" className="text-blue-400 text-sm mt-2 hover:underline inline-block">← Back to alerts</Link>
        </div>
      </AppLayout>
    );
  }

  const updateStatus = (newStatus: AlertStatus) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a));
  };

  const addComment = () => {
    if (!comment.trim()) return;
    setAlerts(prev => prev.map(a => {
      if (a.id !== alertId) return a;
      return {
        ...a,
        comments: [...a.comments, {
          id: `c${Date.now()}`,
          author: 'Sarah Chen',
          role: 'SOC_ANALYST',
          content: comment,
          createdAt: new Date().toISOString(),
        }],
      };
    }));
    setComment('');
  };

  const createIncident = () => {
    router.push('/incidents?create=' + alertId);
  };

  const timelineTypeColors: Record<string, string> = {
    AUTH: 'bg-yellow-500',
    IAM_EVENT: 'bg-red-500',
    CONFIG: 'bg-orange-500',
    ALERT: 'bg-blue-500',
    STATUS: 'bg-green-500',
    API: 'bg-purple-500',
    SCAN: 'bg-cyan-500',
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-6xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/alerts" className="text-gray-500 hover:text-gray-300 transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <SeverityBadge severity={alert.severity} size="md" />
              <StatusBadge status={alert.status} />
              <span className="text-gray-600 text-sm">{alert.id}</span>
              <span className="text-gray-600 text-xs bg-gray-800 px-2 py-0.5 rounded">{alert.mitreId} — {alert.mitreTactic}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{alert.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{alert.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Main content */}
          <div className="col-span-2 space-y-5">
            {/* Alert metadata */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Alert Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Clock, label: 'Detected', value: new Date(alert.createdAt).toLocaleString() },
                  { icon: Clock, label: 'Updated', value: new Date(alert.updatedAt).toLocaleString() },
                  { icon: Globe, label: 'Source IP', value: alert.sourceIp, mono: true, danger: alert.sourceIp !== 'N/A' },
                  { icon: User, label: 'Username', value: alert.username, mono: true },
                  { icon: Box, label: 'Resource', value: alert.resource.length > 45 ? alert.resource.slice(0, 45) + '…' : alert.resource, mono: true },
                  { icon: MapPin, label: 'AWS Region', value: alert.region },
                  { icon: Shield, label: 'Detection Rule', value: alert.detectionRule },
                  { icon: Globe, label: 'Cloud Account', value: alert.cloudAccount },
                ].map(({ icon: Icon, label, value, mono, danger }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-gray-500 text-xs">{label}</div>
                      <div className={`text-sm mt-0.5 ${mono ? 'font-mono' : ''} ${danger ? 'text-red-400' : 'text-gray-300'}`}>
                        {value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Security Event Timeline</h2>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-800"></div>
                <div className="space-y-4">
                  {alert.timeline.map((event, idx) => (
                    <div key={event.id} className="flex items-start gap-4 pl-8 relative">
                      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${timelineTypeColors[event.type] ?? 'bg-gray-700'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 bg-gray-800/40 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-200 text-sm font-medium">{event.description}</span>
                            {event.severity && <SeverityBadge severity={event.severity} size="xs" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${timelineTypeColors[event.type] ? 'text-white' : 'text-gray-500'}`}
                            style={{ backgroundColor: (timelineTypeColors[event.type] ?? '#374151') + '33' }}>
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Raw Event */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center justify-between w-full"
              >
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Raw Event Data</h2>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
              </button>
              {showRaw && (
                <pre className="mt-4 bg-gray-950 border border-gray-800 rounded p-4 text-xs text-green-400 overflow-x-auto font-mono leading-relaxed">
                  {JSON.stringify({
                    alertId: alert.id,
                    detectedAt: alert.createdAt,
                    detectionRule: alert.detectionRule,
                    mitreId: alert.mitreId,
                    mitreTactic: alert.mitreTactic,
                    source: { ip: alert.sourceIp, username: alert.username, cloudAccount: alert.cloudAccount },
                    resource: alert.resource,
                    region: alert.region,
                    rawCloudEvent: { eventName: alert.detectionRule.split(' ')[0], eventSource: 'cloudtrail.amazonaws.com', sourceIPAddress: alert.sourceIp },
                  }, null, 2)}
                </pre>
              )}
            </div>

            {/* Comments */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Investigation Notes ({alert.comments.length})
              </h2>
              <div className="space-y-3 mb-4">
                {alert.comments.length === 0 ? (
                  <p className="text-gray-600 text-sm italic">No notes yet. Add the first note.</p>
                ) : (
                  alert.comments.map((c) => (
                    <div key={c.id} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{c.author.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{c.author}</span>
                        <span className="text-gray-600 text-xs">{c.role}</span>
                        <span className="text-gray-700 text-xs ml-auto">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add investigation note..."
                  rows={2}
                  className="flex-1 bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none"
                />
                <button
                  onClick={addComment}
                  disabled={!comment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Actions</h2>
              <div className="space-y-2">
                {STATUS_ACTIONS.map(({ label, newStatus, icon: Icon, className }) => (
                  <button
                    key={newStatus}
                    onClick={() => updateStatus(newStatus)}
                    disabled={alert.status === newStatus}
                    className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {alert.status === newStatus && <span className="ml-auto text-xs opacity-70">Current</span>}
                  </button>
                ))}
                <div className="border-t border-gray-800 pt-2 mt-2 space-y-2">
                  <button
                    onClick={() => updateStatus('INVESTIGATING')}
                    className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    Assign to Me
                  </button>
                  <button
                    onClick={createIncident}
                    className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-orange-600/20 border border-orange-600/40 hover:bg-orange-600/30 text-orange-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Incident
                  </button>
                  <Link href={`/detection-rules`}>
                    <button className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      View Detection Rule
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Assignment</h2>
              <div className="space-y-2">
                <div className="text-gray-500 text-xs">Assigned to</div>
                <div className="flex items-center gap-2">
                  {alert.assignedTo ? (
                    <>
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {alert.assignedTo.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-gray-300 text-sm">{alert.assignedTo}</span>
                    </>
                  ) : (
                    <span className="text-gray-600 text-sm italic">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* MITRE Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">MITRE ATT&CK</h2>
              <div className="space-y-2">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Technique</div>
                  <div className="bg-gray-800 rounded px-2 py-1.5 text-xs font-mono text-red-400 font-bold">{alert.mitreId}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Tactic</div>
                  <div className="text-gray-300 text-sm">{alert.mitreTactic}</div>
                </div>
                <a
                  href={`https://attack.mitre.org/techniques/${alert.mitreId.replace('.', '/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 text-xs hover:underline mt-2"
                >
                  View on MITRE ATT&CK <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Alert metadata */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Metadata</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Source</span>
                  <span className="text-gray-300 font-medium">{alert.source.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cloud Account</span>
                  <span className="text-gray-300 font-medium">{alert.cloudAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Region</span>
                  <span className="text-gray-300 font-medium">{alert.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timeline Events</span>
                  <span className="text-gray-300 font-medium">{alert.timeline.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
