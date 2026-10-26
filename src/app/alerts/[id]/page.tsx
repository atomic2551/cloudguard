'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Globe, User, Box, MapPin, Shield,
  CheckCircle2, AlertTriangle, Search, UserCheck, Plus,
  XCircle, MessageSquare, ExternalLink, ChevronDown, Loader2
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, AlertDto, AlertStatus, AlertTimelineDto, AlertCommentDto, Severity } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

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
  const { user } = useAuth();

  const isViewer = user?.roles?.includes('VIEWER') && !user?.roles?.includes('ADMIN') && !user?.roles?.includes('SOC_ANALYST');

  const [alert, setAlert] = useState<AlertDto | null>(null);
  const [timeline, setTimeline] = useState<AlertTimelineDto[]>([]);
  const [comments, setComments] = useState<AlertCommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const fetchAlertData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertData, timelineData] = await Promise.all([
        api.alerts.getById(alertId),
        api.alerts.getTimeline(alertId).catch(() => []),
      ]);
      setAlert(alertData);
      setTimeline(timelineData);
    } catch (err: unknown) {
      console.error('Failed to load alert details:', err);
      setError('Alert not found or failed to load.');
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    fetchAlertData();
  }, [fetchAlertData]);

  const handleUpdateStatus = async (newStatus: AlertStatus) => {
    if (isViewer) return;
    setUpdatingStatus(true);
    try {
      const updated = await api.alerts.updateStatus(alertId, newStatus, `Status updated to ${newStatus}`);
      setAlert(updated);
      const updatedTimeline = await api.alerts.getTimeline(alertId).catch(() => []);
      setTimeline(updatedTimeline);
    } catch (err) {
      console.error('Failed to update status:', err);
      alertModal('Failed to update alert status. Please check your permissions.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const alertModal = (msg: string) => {
    window.alert(msg);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isViewer) return;
    setSubmittingComment(true);
    try {
      const newComment = await api.alerts.addComment(alertId, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      alertModal('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const createIncident = () => {
    router.push(`/incidents?createAlert=${alertId}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading security alert details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !alert) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-gray-500 mt-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="text-gray-300 font-semibold">{error || `Alert not found: ${alertId}`}</p>
          <Link href="/alerts" className="text-blue-400 text-sm mt-3 hover:underline inline-block">
            ← Back to security alerts
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
          <Link href="/alerts" className="text-gray-500 hover:text-gray-300 transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <SeverityBadge severity={alert.severity as Severity} size="md" />
              <StatusBadge status={alert.status} />
              <span className="text-gray-500 text-sm font-mono">{alert.alertNumber || alert.id}</span>
              {alert.mitreTechniqueId && (
                <span className="text-gray-400 text-xs bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                  {alert.mitreTechniqueId} {alert.mitreTactic ? `— ${alert.mitreTactic}` : ''}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white">{alert.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{alert.description || 'No detailed description available.'}</p>
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
                  { icon: Globe, label: 'Source IP', value: alert.sourceIp || 'N/A', mono: true, danger: Boolean(alert.sourceIp) },
                  { icon: User, label: 'Username', value: alert.userIdentity || 'N/A', mono: true },
                  { icon: Box, label: 'Target Resource', value: alert.targetResource || 'N/A', mono: true },
                  { icon: MapPin, label: 'Region', value: alert.region || 'global' },
                  { icon: Shield, label: 'Source System', value: alert.source || 'DETECTION_ENGINE' },
                  { icon: Globe, label: 'Cloud Account ID', value: alert.cloudAccountId || 'default' },
                ].map(({ icon: Icon, label, value, mono, danger }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-gray-500 text-xs">{label}</div>
                      <div className={`text-sm mt-0.5 break-all ${mono ? 'font-mono' : ''} ${danger ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                        {value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Event Timeline</h2>
              {timeline.length === 0 ? (
                <div className="text-gray-600 text-sm py-4 italic">No timeline events recorded yet.</div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-800"></div>
                  <div className="space-y-4">
                    {timeline.map((event, idx) => (
                      <div key={event.id} className="flex items-start gap-4 pl-8 relative">
                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-blue-600">
                          {idx + 1}
                        </div>
                        <div className="flex-1 bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-200 text-sm font-medium">{event.description}</span>
                            {event.severity && <SeverityBadge severity={event.severity as Severity} size="xs" />}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(event.eventTime || event.createdAt).toLocaleString()}</span>
                            {event.actor && <span>· Actor: {event.actor}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Raw Event */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center justify-between w-full"
              >
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Raw Alert Data</h2>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
              </button>
              {showRaw && (
                <pre className="mt-4 bg-gray-950 border border-gray-800 rounded p-4 text-xs text-green-400 overflow-x-auto font-mono leading-relaxed">
                  {JSON.stringify(alert, null, 2)}
                </pre>
              )}
            </div>

            {/* Comments & Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Investigation Notes ({comments.length})
              </h2>
              <div className="space-y-3 mb-4">
                {comments.length === 0 ? (
                  <p className="text-gray-600 text-sm italic">No investigation notes added yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{c.authorName ? c.authorName.charAt(0) : 'U'}</span>
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{c.authorName || 'Analyst'}</span>
                        <span className="text-gray-600 text-xs ml-auto">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              {!isViewer && (
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add investigation note..."
                    rows={2}
                    disabled={submittingComment}
                    className="flex-1 bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 rounded-md transition-colors"
                  >
                    {submittingComment ? 'Adding...' : 'Add'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            {!isViewer && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Status Actions</h2>
                <div className="space-y-2">
                  {STATUS_ACTIONS.map(({ label, newStatus, icon: Icon, className }) => (
                    <button
                      key={newStatus}
                      onClick={() => handleUpdateStatus(newStatus)}
                      disabled={alert.status === newStatus || updatingStatus}
                      className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      {alert.status === newStatus && <span className="ml-auto text-xs opacity-70">Current</span>}
                    </button>
                  ))}
                  <div className="border-t border-gray-800 pt-2 mt-2 space-y-2">
                    <button
                      onClick={createIncident}
                      className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-orange-600/20 border border-orange-600/40 hover:bg-orange-600/30 text-orange-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Promote to Incident
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Assignment */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Assignment</h2>
              <div className="space-y-2">
                <div className="text-gray-500 text-xs">Assigned SOC Analyst</div>
                <div className="flex items-center gap-2">
                  {alert.assignedToName || alert.assignedTo ? (
                    <>
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {(alert.assignedToName || alert.assignedTo || 'A').charAt(0)}
                        </span>
                      </div>
                      <span className="text-gray-300 text-sm">{alert.assignedToName || alert.assignedTo}</span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm italic">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* MITRE ATT&CK Info */}
            {alert.mitreTechniqueId && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">MITRE ATT&CK</h2>
                <div className="space-y-2">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Technique</div>
                    <div className="bg-gray-800 rounded px-2 py-1.5 text-xs font-mono text-red-400 font-bold border border-gray-700">
                      {alert.mitreTechniqueId}
                    </div>
                  </div>
                  {alert.mitreTactic && (
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Tactic</div>
                      <div className="text-gray-300 text-sm">{alert.mitreTactic}</div>
                    </div>
                  )}
                  <a
                    href={`https://attack.mitre.org/techniques/${alert.mitreTechniqueId.replace('.', '/')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 text-xs hover:underline mt-2"
                  >
                    View on MITRE ATT&CK <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
