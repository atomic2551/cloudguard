'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, User, MessageSquare, AlertTriangle, ChevronRight, Plus } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockIncidents, mockAlerts, type IncidentStatus } from '@/lib/mock-data';

const incidentStatuses: IncidentStatus[] = ['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'];

const timelineTypeColors: Record<string, string> = {
  ALERT: 'bg-red-600',
  INCIDENT_CREATED: 'bg-blue-600',
  NOTE: 'bg-purple-600',
  ACTION: 'bg-orange-600',
  STATUS_CHANGE: 'bg-green-600',
  ASSIGNMENT: 'bg-cyan-600',
};

export default function IncidentDetailPage() {
  const params = useParams();
  const incidentId = params.id as string;

  const [incidents, setIncidents] = useState(mockIncidents);
  const [noteContent, setNoteContent] = useState('');

  const incident = incidents.find((i) => i.id === incidentId);

  if (!incident) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-gray-500 mt-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p>Incident not found: {incidentId}</p>
          <Link href="/incidents" className="text-blue-400 text-sm mt-2 hover:underline inline-block">← Back to incidents</Link>
        </div>
      </AppLayout>
    );
  }

  const relatedAlerts = mockAlerts.filter(a => incident.relatedAlerts.includes(a.id));

  const updateStatus = (newStatus: IncidentStatus) => {
    setIncidents(prev => prev.map(i => {
      if (i.id !== incidentId) return i;
      const newTimeline = [...i.timeline, {
        id: `tl${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'STATUS_CHANGE',
        description: `Status changed to ${newStatus}`,
        actor: 'Sarah Chen',
      }];
      return { ...i, status: newStatus, updatedAt: new Date().toISOString(), timeline: newTimeline };
    }));
  };

  const addNote = () => {
    if (!noteContent.trim()) return;
    setIncidents(prev => prev.map(i => {
      if (i.id !== incidentId) return i;
      return {
        ...i,
        notes: [...i.notes, {
          id: `n${Date.now()}`,
          author: 'Sarah Chen',
          content: noteContent,
          createdAt: new Date().toISOString(),
          isPrivate: false,
        }],
        timeline: [...i.timeline, {
          id: `tl${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'NOTE',
          description: `Investigation note added`,
          actor: 'Sarah Chen',
        }],
      };
    }));
    setNoteContent('');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-6xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/incidents" className="text-gray-500 hover:text-gray-300 transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <SeverityBadge severity={incident.severity} size="md" />
              <StatusBadge status={incident.status} />
              <span className="text-gray-600 text-sm font-mono">{incident.id}</span>
              <span className="text-gray-600 text-xs bg-gray-800 px-2 py-0.5 rounded">{incident.category}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{incident.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{incident.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Main content */}
          <div className="col-span-2 space-y-5">
            {/* Timeline */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Incident Timeline ({incident.timeline.length} events)
              </h2>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-800"></div>
                <div className="space-y-3">
                  {incident.timeline.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 pl-8 relative">
                      <div className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center ${timelineTypeColors[event.type] ?? 'bg-gray-700'}`}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="flex-1 bg-gray-800/40 rounded-lg px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-200 text-sm">{event.description}</span>
                          <span className="text-gray-600 text-xs ml-4 flex-shrink-0">{event.actor}</span>
                        </div>
                        <div className="text-gray-600 text-xs mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString()}
                          <span className={`px-1.5 rounded text-white text-xs font-medium ${timelineTypeColors[event.type] ?? 'bg-gray-700'}`}>
                            {event.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Investigation Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Investigation Notes ({incident.notes.length})
              </h2>
              <div className="space-y-3 mb-4">
                {incident.notes.length === 0 ? (
                  <p className="text-gray-600 text-sm italic">No investigation notes yet.</p>
                ) : (
                  incident.notes.map((note) => (
                    <div key={note.id} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{note.author.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{note.author}</span>
                        <span className="text-gray-700 text-xs ml-auto">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add investigation note..."
                  rows={2}
                  className="flex-1 bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none"
                />
                <button
                  onClick={addNote}
                  disabled={!noteContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Related Alerts */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Related Alerts ({relatedAlerts.length})
              </h2>
              {relatedAlerts.length === 0 ? (
                <p className="text-gray-600 text-sm italic">No related alerts linked to this incident.</p>
              ) : (
                <div className="space-y-2">
                  {relatedAlerts.map((alert) => (
                    <Link key={alert.id} href={`/alerts/${alert.id}`}>
                      <div className="flex items-center gap-3 bg-gray-800/40 hover:bg-gray-800 rounded-lg px-3 py-2.5 transition-colors group">
                        <SeverityBadge severity={alert.severity} size="xs" />
                        <span className="text-gray-600 text-xs font-mono w-16">{alert.id}</span>
                        <span className="text-gray-300 text-sm flex-1">{alert.title}</span>
                        <StatusBadge status={alert.status} />
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Evidence</h2>
              {incident.evidence.length === 0 ? (
                <p className="text-gray-600 text-sm italic">No evidence collected yet.</p>
              ) : (
                <ul className="space-y-2">
                  {incident.evidence.map((e, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status control */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Incident Status</h2>
              <div className="space-y-2">
                {incidentStatuses.map((status) => {
                  const colors: Record<IncidentStatus, string> = {
                    OPEN: 'border-red-500/40 hover:bg-red-500/10 text-red-400',
                    INVESTIGATING: 'border-yellow-500/40 hover:bg-yellow-500/10 text-yellow-400',
                    CONTAINED: 'border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400',
                    RESOLVED: 'border-green-500/40 hover:bg-green-500/10 text-green-400',
                    CLOSED: 'border-gray-600/40 hover:bg-gray-600/10 text-gray-500',
                  };
                  const isActive = incident.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => updateStatus(status)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${colors[status]} ${isActive ? 'ring-2 ring-white/20' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{status}</span>
                        {isActive && <span className="text-xs opacity-60">Current</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignment */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <User className="w-3.5 h-3.5 inline mr-1" />
                Assignment
              </h2>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {incident.assignedTo !== 'Unassigned'
                      ? incident.assignedTo.split(' ').map(n => n[0]).join('')
                      : '?'}
                  </span>
                </div>
                <div>
                  <div className="text-gray-300 text-sm">{incident.assignedTo}</div>
                  <div className="text-gray-600 text-xs">SOC Analyst</div>
                </div>
              </div>
              <button className="w-full text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-md transition-colors flex items-center gap-2">
                <User className="w-4 h-4" />
                Assign to Me
              </button>
            </div>

            {/* Metadata */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Details</h2>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Created', value: new Date(incident.createdAt).toLocaleString() },
                  { label: 'Updated', value: new Date(incident.updatedAt).toLocaleString() },
                  { label: 'Severity', value: incident.severity },
                  { label: 'Category', value: incident.category },
                  { label: 'Related Alerts', value: incident.relatedAlerts.length.toString() },
                  { label: 'Timeline Events', value: incident.timeline.length.toString() },
                  ...(incident.resolvedAt ? [{ label: 'Resolved', value: new Date(incident.resolvedAt).toLocaleString() }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-300 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/alerts">
                  <button className="w-full text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-md transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Link Alert
                  </button>
                </Link>
                <button className="w-full text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-md transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Add Evidence
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
