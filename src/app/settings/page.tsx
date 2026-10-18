'use client';

import { useState } from 'react';
import { Settings, Bell, Shield, Cloud, User, CheckCircle2, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

type Tab = 'profile' | 'security' | 'notifications' | 'detection' | 'cloud';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'detection', label: 'Detection', icon: Settings },
  { id: 'cloud', label: 'Cloud Config', icon: Cloud },
];

function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="text-gray-300 text-sm font-medium">{label}</div>
        <div className="text-gray-600 text-xs mt-0.5">{description}</div>
      </div>
      <button onClick={() => onChange(!value)} className="ml-4">
        {value ? (
          <ToggleRight className="w-8 h-8 text-green-400 hover:text-green-300 transition-colors" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-gray-600 hover:text-gray-400 transition-colors" />
        )}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Sarah Chen',
    email: 'sarah.chen@acmecorp.io',
    department: 'SOC Team',
    phone: '+1 (555) 234-5678',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    criticalAlerts: true,
    highAlerts: true,
    mediumAlerts: false,
    incidentAssigned: true,
    incidentUpdated: true,
    weeklyReport: true,
    slackIntegration: false,
    webhookEnabled: false,
  });

  const [detection, setDetection] = useState({
    autoInvestigate: true,
    autoAssign: false,
    createIncidentOnCritical: true,
    deduplication: true,
    correlationEnabled: true,
    mockMode: true,
  });

  const [security, setSecurity] = useState({
    sessionTimeout: '8',
    mfaEnforced: true,
    ipWhitelist: false,
    auditAllActions: true,
    rateLimitEnabled: true,
  });

  const [cloud, setCloud] = useState({
    syncInterval: '15',
    mockCloudProvider: true,
    autoScan: true,
    scanInterval: '60',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = "w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500";
  const labelClass = "text-gray-400 text-xs font-medium block mb-1";

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">Platform configuration and preferences</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        <div className="flex gap-5">
          {/* Tab navigation */}
          <div className="w-44 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                    activeTab === id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-5 min-h-96">
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <h2 className="text-gray-200 text-sm font-semibold border-b border-gray-800 pb-3">Profile Settings</h2>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">SC</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{profile.name}</div>
                    <div className="text-gray-500 text-sm">SOC Analyst · Active</div>
                    <button className="text-blue-400 text-xs mt-1 hover:underline">Change avatar</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Department</label>
                    <input type="text" value={profile.department} onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input type="tel" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-xs text-gray-500">
                  <strong className="text-gray-400">Role:</strong> SOC Analyst ·{' '}
                  <strong className="text-gray-400">Account Status:</strong> Active ·{' '}
                  <strong className="text-gray-400">MFA:</strong> <span className="text-green-400">Enabled</span>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <h2 className="text-gray-200 text-sm font-semibold border-b border-gray-800 pb-3">Security Settings</h2>
                <div>
                  <label className={labelClass}>Session Timeout (hours)</label>
                  <select value={security.sessionTimeout} onChange={(e) => setSecurity(p => ({ ...p, sessionTimeout: e.target.value }))}
                    className={inputClass + ' cursor-pointer'}>
                    {['1', '2', '4', '8', '12', '24'].map(v => <option key={v} value={v}>{v} hours</option>)}
                  </select>
                </div>
                <div className="divide-y divide-gray-800/50">
                  <ToggleRow label="Enforce MFA for all users" description="Require multi-factor authentication for all platform users" value={security.mfaEnforced} onChange={(v) => setSecurity(p => ({ ...p, mfaEnforced: v }))} />
                  <ToggleRow label="IP Whitelist" description="Restrict platform access to specific IP ranges" value={security.ipWhitelist} onChange={(v) => setSecurity(p => ({ ...p, ipWhitelist: v }))} />
                  <ToggleRow label="Audit All Actions" description="Log all user actions in the audit trail" value={security.auditAllActions} onChange={(v) => setSecurity(p => ({ ...p, auditAllActions: v }))} />
                  <ToggleRow label="Rate Limiting" description="Limit login attempts to prevent brute force attacks" value={security.rateLimitEnabled} onChange={(v) => setSecurity(p => ({ ...p, rateLimitEnabled: v }))} />
                </div>
                <div>
                  <label className={labelClass}>Change Password</label>
                  <div className="space-y-2">
                    <input type="password" placeholder="Current password" className={inputClass} />
                    <input type="password" placeholder="New password (min 16 chars)" className={inputClass} />
                    <input type="password" placeholder="Confirm new password" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-gray-200 text-sm font-semibold border-b border-gray-800 pb-3">Notification Settings</h2>
                <div className="divide-y divide-gray-800/50">
                  <ToggleRow label="Email Notifications" description="Receive security alerts via email" value={notifications.emailNotifications} onChange={(v) => setNotifications(p => ({ ...p, emailNotifications: v }))} />
                  <ToggleRow label="Critical Alert Notifications" description="Immediate notification for critical severity alerts" value={notifications.criticalAlerts} onChange={(v) => setNotifications(p => ({ ...p, criticalAlerts: v }))} />
                  <ToggleRow label="High Alert Notifications" description="Notification for high severity alerts" value={notifications.highAlerts} onChange={(v) => setNotifications(p => ({ ...p, highAlerts: v }))} />
                  <ToggleRow label="Medium Alert Notifications" description="Notification for medium severity alerts" value={notifications.mediumAlerts} onChange={(v) => setNotifications(p => ({ ...p, mediumAlerts: v }))} />
                  <ToggleRow label="Incident Assigned" description="Notify when an incident is assigned to you" value={notifications.incidentAssigned} onChange={(v) => setNotifications(p => ({ ...p, incidentAssigned: v }))} />
                  <ToggleRow label="Incident Updated" description="Notify on incident status changes" value={notifications.incidentUpdated} onChange={(v) => setNotifications(p => ({ ...p, incidentUpdated: v }))} />
                  <ToggleRow label="Weekly Security Report" description="Receive weekly summary reports" value={notifications.weeklyReport} onChange={(v) => setNotifications(p => ({ ...p, weeklyReport: v }))} />
                  <ToggleRow label="Slack Integration" description="Send alerts to Slack channel (coming soon)" value={notifications.slackIntegration} onChange={(v) => setNotifications(p => ({ ...p, slackIntegration: v }))} />
                  <ToggleRow label="Webhook Notifications" description="Send alerts to custom webhook endpoint" value={notifications.webhookEnabled} onChange={(v) => setNotifications(p => ({ ...p, webhookEnabled: v }))} />
                </div>
                {notifications.webhookEnabled && (
                  <div>
                    <label className={labelClass}>Webhook URL</label>
                    <input type="url" placeholder="https://your-webhook-endpoint.com/cloudguard" className={inputClass} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'detection' && (
              <div className="space-y-4">
                <h2 className="text-gray-200 text-sm font-semibold border-b border-gray-800 pb-3">Detection Engine Settings</h2>
                <div className="divide-y divide-gray-800/50">
                  <ToggleRow label="Auto-Investigate Critical Alerts" description="Automatically change status to Investigating for critical alerts" value={detection.autoInvestigate} onChange={(v) => setDetection(p => ({ ...p, autoInvestigate: v }))} />
                  <ToggleRow label="Auto-Assign Alerts" description="Automatically assign alerts to available analysts" value={detection.autoAssign} onChange={(v) => setDetection(p => ({ ...p, autoAssign: v }))} />
                  <ToggleRow label="Auto-Create Incident on Critical" description="Automatically create incident for critical alerts" value={detection.createIncidentOnCritical} onChange={(v) => setDetection(p => ({ ...p, createIncidentOnCritical: v }))} />
                  <ToggleRow label="Alert Deduplication" description="Suppress duplicate alerts within time window" value={detection.deduplication} onChange={(v) => setDetection(p => ({ ...p, deduplication: v }))} />
                  <ToggleRow label="Event Correlation" description="Correlate related events for richer context" value={detection.correlationEnabled} onChange={(v) => setDetection(p => ({ ...p, correlationEnabled: v }))} />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <ToggleRow label="Mock Cloud Provider Mode" description="Use simulated data instead of real AWS credentials (development mode)" value={detection.mockMode} onChange={(v) => setDetection(p => ({ ...p, mockMode: v }))} />
                  {detection.mockMode && (
                    <p className="text-blue-400 text-xs mt-2">🔵 Mock mode active — all data is simulated. Disable to connect real AWS accounts.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cloud' && (
              <div className="space-y-4">
                <h2 className="text-gray-200 text-sm font-semibold border-b border-gray-800 pb-3">Cloud Configuration</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>CloudTrail Sync Interval (minutes)</label>
                    <select value={cloud.syncInterval} onChange={(e) => setCloud(p => ({ ...p, syncInterval: e.target.value }))}
                      className={inputClass + ' cursor-pointer'}>
                      {['5', '10', '15', '30', '60'].map(v => <option key={v} value={v}>Every {v} minutes</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Auto Scan Interval (minutes)</label>
                    <select value={cloud.scanInterval} onChange={(e) => setCloud(p => ({ ...p, scanInterval: e.target.value }))}
                      className={inputClass + ' cursor-pointer'}>
                      {['30', '60', '120', '240', '1440'].map(v => (
                        <option key={v} value={v}>
                          {Number(v) >= 1440 ? 'Daily' : Number(v) >= 60 ? `Every ${Number(v)/60} hours` : `Every ${v} minutes`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="divide-y divide-gray-800/50">
                  <ToggleRow label="Auto Scan on Account Add" description="Run security scan immediately when a new account is connected" value={cloud.autoScan} onChange={(v) => setCloud(p => ({ ...p, autoScan: v }))} />
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">Required AWS IAM Permissions</h3>
                  <pre className="text-green-400 text-xs font-mono leading-relaxed">
{`cloudtrail:LookupEvents
cloudtrail:DescribeTrails
iam:ListUsers
iam:ListRoles
iam:ListPolicies
iam:GetUser
iam:ListAccessKeys
ec2:DescribeInstances
ec2:DescribeSecurityGroups
s3:ListAllMyBuckets
s3:GetBucketAcl
s3:GetBucketPolicy`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
