'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, User, MessageSquare, AlertTriangle, ChevronRight, Plus,
  Sparkles, ShieldCheck, CheckCircle2, Loader2, Bot, FileText, Lock
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, IncidentDto, IncidentStatus, IncidentTimelineDto, IncidentNoteDto, Severity } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

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
  const { user } = useAuth();
  const isViewer = user?.roles?.includes('VIEWER') && !user?.roles?.includes('ADMIN') && !user?.roles?.includes('SOC_ANALYST');

  const [incident, setIncident] = useState<IncidentDto | null>(null);
  const [timeline, setTimeline] = useState<IncidentTimelineDto[]>([]);
  const [notes, setNotes] = useState<IncidentNoteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // AI Analyst state
  const [aiReport, setAiReport] = useState<{
    summary: string;
    rootCause: string;
    blastRadius: string;
    recommendedActions: string[];
    riskScore: number;
    tokensUsed: number;
    estimatedCost: string;
    redactedFields: string[];
  } | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  const fetchIncidentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inc, tl] = await Promise.all([
        api.incidents.getById(incidentId),
        api.incidents.getTimeline(incidentId).catch(() => []),
      ]);
      setIncident(inc);
      setTimeline(tl);
    } catch (err: unknown) {
      console.error('Failed to load incident:', err);
      setError('Incident not found or server error occurred.');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchIncidentData();
  }, [fetchIncidentData]);

  const updateStatus = async (newStatus: IncidentStatus) => {
    if (isViewer || !incident) return;
    setUpdatingStatus(true);
    try {
      const updated = await api.incidents.update(incidentId, { status: newStatus });
      setIncident(updated);
      const updatedTimeline = await api.incidents.getTimeline(incidentId).catch(() => []);
      setTimeline(updatedTimeline);
    } catch (err: unknown) {
      console.error('Failed to update incident status:', err);
      window.alert('Failed to update status. Check permissions.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addNote = async () => {
    if (!noteContent.trim() || isViewer) return;
    setSubmittingNote(true);
    try {
      const newNote = await api.incidents.addNote(incidentId, noteContent.trim(), false);
      setNotes((prev) => [...prev, newNote]);
      setNoteContent('');
      const updatedTimeline = await api.incidents.getTimeline(incidentId).catch(() => []);
      setTimeline(updatedTimeline);
    } catch (err: unknown) {
      console.error('Failed to add note:', err);
      window.alert('Failed to record investigation note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const generateAiAnalysis = () => {
    setGeneratingAi(true);
    // Simulates calling SecLab XDR / Claude API with redacted credentials
    setTimeout(() => {
      setAiReport({
        summary: `Incident ${incident?.incidentNumber || incident?.id.slice(0, 8)} involves suspicious administrative policy manipulation. An IAM identity was escalated outside standard maintenance windows, exhibiting MITRE ATT&CK T1098 (Account Manipulation).`,
        rootCause: 'Compromised or improperly scoped credentials used from an untrusted public IP range to attach AdministratorAccess policy.',
        blastRadius: 'Potential full cloud infrastructure compromise across AWS Account. S3 buckets, EC2 instances, and RDS databases are at risk.',
        recommendedActions: [
          'Immediately detach AdministratorAccess policy from the affected principal.',
          'Revoke all active sessions and temporary STS tokens for the entity.',
          'Rotate root access keys and enable hardware MFA across administrative accounts.',
          'Check VPC flow logs for unauthorized egress connections.',
        ],
        riskScore: 94,
        tokensUsed: 842,
        estimatedCost: '$0.0025',
        redactedFields: ['password_hash', 'session_token', 'access_key_secret', 'personal_identifiers'],
      });
      setGeneratingAi(false);
    }, 1200);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading incident details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !incident) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-gray-500 mt-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="text-gray-300 font-semibold">{error || `Incident not found: ${incidentId}`}</p>
          <Link href="/incidents" className="text-blue-400 text-sm mt-3 hover:underline inline-block">
            ← Back to incidents
          </Link>
        </div>
      </AppLayout>
    );
  }

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
              <SeverityBadge severity={incident.severity as Severity} size="md" />
              <StatusBadge status={incident.status} />
              <span className="text-gray-400 text-sm font-mono font-semibold">{incident.incidentNumber || incident.id}</span>
              <span className="text-gray-400 text-xs bg-gray-800 px-2.5 py-0.5 rounded border border-gray-700">
                {incident.category || 'General Security Incident'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">{incident.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{incident.description || 'No description provided.'}</p>
          </div>
          <button
            onClick={generateAiAnalysis}
            disabled={generatingAi}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generatingAi ? 'animate-spin' : ''}`} />
            {generatingAi ? 'Analyzing with AI...' : 'AI Analyst Insight'}
          </button>
        </div>

        {/* AI Analyst Panel (Stage 6 / Stage 11 Task 7) */}
        {aiReport && (
          <div className="bg-gradient-to-br from-purple-950/40 via-gray-900 to-indigo-950/40 border border-purple-500/30 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold text-base">SecLab AI Analyst Report (Claude Engine)</h3>
                <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full font-mono">
                  Risk Score: {aiReport.riskScore}/100
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1 text-green-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Redacted credentials
                </span>
                <span>Tokens: {aiReport.tokensUsed}</span>
                <span>Cost: {aiReport.estimatedCost}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-purple-300 font-semibold block mb-0.5">Summary</span>
                <p className="text-gray-300 leading-relaxed">{aiReport.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="bg-gray-900/60 p-3 rounded-lg border border-purple-500/20">
                  <span className="text-red-400 font-semibold block text-xs uppercase mb-1">Root Cause</span>
                  <p className="text-gray-300 text-xs">{aiReport.rootCause}</p>
                </div>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-purple-500/20">
                  <span className="text-yellow-400 font-semibold block text-xs uppercase mb-1">Blast Radius</span>
                  <p className="text-gray-300 text-xs">{aiReport.blastRadius}</p>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-indigo-300 font-semibold block mb-2">Recommended Playbook Actions</span>
                <ul className="space-y-1.5">
                  {aiReport.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-gray-500">
                <Lock className="w-3 h-3 text-gray-400" />
                <span>Sanitized fields: {aiReport.redactedFields.join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          {/* Main content */}
          <div className="col-span-2 space-y-5">
            {/* Timeline */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Incident Timeline ({timeline.length} events)
              </h2>
              {timeline.length === 0 ? (
                <p className="text-gray-600 text-sm italic py-2">No timeline events recorded yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-800"></div>
                  <div className="space-y-3">
                    {timeline.map((event) => (
                      <div key={event.id} className="flex items-start gap-4 pl-8 relative">
                        <div className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center ${timelineTypeColors[event.eventType] ?? 'bg-gray-700'}`}>
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div className="flex-1 bg-gray-800/40 rounded-lg px-3 py-2.5 border border-gray-800">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-200 text-sm font-medium">{event.description}</span>
                            <span className="text-gray-500 text-xs ml-4 flex-shrink-0">{event.actor || 'System'}</span>
                          </div>
                          <div className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(event.eventTime || event.createdAt).toLocaleString()}
                            <span className={`px-1.5 py-0.2 rounded text-white text-[10px] font-semibold ${timelineTypeColors[event.eventType] ?? 'bg-gray-700'}`}>
                              {event.eventType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Investigation Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Analyst Notes ({notes.length})
              </h2>
              <div className="space-y-3 mb-4">
                {notes.length === 0 ? (
                  <p className="text-gray-600 text-sm italic">No investigation notes yet. Write initial notes below.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{(note.authorName || 'A').charAt(0)}</span>
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{note.authorName || 'Analyst'}</span>
                        <span className="text-gray-600 text-xs ml-auto">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
              {!isViewer && (
                <div className="flex gap-2">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add an incident investigation note..."
                    rows={2}
                    disabled={submittingNote}
                    className="flex-1 bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none disabled:opacity-50"
                  />
                  <button
                    onClick={addNote}
                    disabled={!noteContent.trim() || submittingNote}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 rounded-md transition-colors"
                  >
                    {submittingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              )}
            </div>

            {/* Related Alerts */}
            {incident.alerts && incident.alerts.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Correlated Alerts ({incident.alerts.length})
                </h2>
                <div className="space-y-2">
                  {incident.alerts.map((al) => (
                    <Link key={al.id} href={`/alerts/${al.id}`}>
                      <div className="flex items-center gap-3 bg-gray-800/40 hover:bg-gray-800 rounded-lg px-3 py-2.5 transition-colors group border border-gray-800">
                        <SeverityBadge severity={al.severity as Severity} size="xs" />
                        <span className="text-gray-500 text-xs font-mono w-20">{al.alertNumber || al.id.slice(0, 8)}</span>
                        <span className="text-gray-200 text-sm flex-1">{al.title}</span>
                        <StatusBadge status={al.status} />
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status control */}
            {!isViewer && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Status Management</h2>
                <div className="space-y-2">
                  {incidentStatuses.map((st) => {
                    const colors: Record<IncidentStatus, string> = {
                      OPEN: 'border-red-500/40 hover:bg-red-500/10 text-red-400',
                      INVESTIGATING: 'border-yellow-500/40 hover:bg-yellow-500/10 text-yellow-400',
                      CONTAINED: 'border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400',
                      RESOLVED: 'border-green-500/40 hover:bg-green-500/10 text-green-400',
                      CLOSED: 'border-gray-600/40 hover:bg-gray-600/10 text-gray-500',
                    };
                    const isActive = incident.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => updateStatus(st)}
                        disabled={isActive || updatingStatus}
                        className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${colors[st]} ${isActive ? 'ring-2 ring-white/20' : ''} disabled:opacity-50`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{st}</span>
                          {isActive && <span className="text-xs opacity-70">Current</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assignment */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <User className="w-3.5 h-3.5 inline mr-1" />
                Assigned Lead
              </h2>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {(incident.assignedToName || incident.assignedTo || 'U').charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-gray-300 text-sm font-medium">{incident.assignedToName || incident.assignedTo || 'Unassigned'}</div>
                  <div className="text-gray-500 text-xs">SOC Operations Lead</div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Incident Metadata</h2>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Created', value: new Date(incident.createdAt).toLocaleString() },
                  { label: 'Updated', value: new Date(incident.updatedAt).toLocaleString() },
                  { label: 'Category', value: incident.category || 'General' },
                  { label: 'Declared By', value: incident.createdByName || 'System' },
                  ...(incident.resolvedAt ? [{ label: 'Resolved', value: new Date(incident.resolvedAt).toLocaleString() }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-300 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Response Actions</h2>
              <div className="space-y-2">
                <Link href="/alerts">
                  <button className="w-full text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-md transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Correlate Additional Alert
                  </button>
                </Link>
                <Link href="/reports">
                  <button className="w-full text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-md transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Export Incident Brief
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
