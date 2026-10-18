'use client';

import { useState } from 'react';
import { Cloud, Plus, RefreshCw, CheckCircle2, AlertTriangle, Server, Shield, Clock, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockCloudAccounts, type CloudAccount, type AccountStatus } from '@/lib/mock-data';

export default function CloudAccountsPage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>(mockCloudAccounts);
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({ name: '', accountId: '', region: 'us-east-1' });

  const syncAccount = (id: string) => {
    setSyncing(id);
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'SYNCING' as AccountStatus } : a));
    setTimeout(() => {
      setSyncing(null);
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'CONNECTED' as AccountStatus, lastSync: new Date().toISOString() } : a));
    }, 3000);
  };

  const addAccount = () => {
    if (!newAccount.name.trim() || !newAccount.accountId.trim()) return;
    const acc: CloudAccount = {
      id: `ACC-00${accounts.length + 1}`,
      name: newAccount.name,
      provider: 'AWS',
      accountId: newAccount.accountId,
      region: newAccount.region,
      status: 'CONNECTED',
      lastSync: new Date().toISOString(),
      securityScore: 85,
      resourceCount: 0,
      criticalFindings: 0,
      highFindings: 0,
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, acc]);
    setShowAdd(false);
    setNewAccount({ name: '', accountId: '', region: 'us-east-1' });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Cloud Accounts</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {accounts.filter(a => a.status === 'CONNECTED').length} connected ·{' '}
              {accounts.length} total accounts
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Cloud Account
          </button>
        </div>

        {/* Add Account Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  Add AWS Account (Mock Mode)
                </h2>
                <button onClick={() => setShowAdd(false)}>
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-blue-400 text-xs">
                  🔒 <strong>Mock Mode Active:</strong> No real AWS credentials required.
                  In production, CloudGuard uses IAM Role-based access — no long-term credentials stored.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Account Name *</label>
                  <input type="text" value={newAccount.name} onChange={(e) => setNewAccount(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. AWS Production"
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">AWS Account ID *</label>
                  <input type="text" value={newAccount.accountId} onChange={(e) => setNewAccount(p => ({ ...p, accountId: e.target.value }))}
                    placeholder="123456789012"
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Primary Region</label>
                  <select value={newAccount.region} onChange={(e) => setNewAccount(p => ({ ...p, region: e.target.value }))}
                    className="w-full bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
                    {['us-east-1', 'us-west-2', 'eu-central-1', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <div className="text-gray-400 text-xs font-medium mb-2">Connection Method</div>
                  <div className="space-y-2">
                    {['IAM Role (Recommended)', 'AWS Access Keys (Development only)'].map((m, i) => (
                      <label key={m} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method" defaultChecked={i === 0} className="accent-blue-500" />
                        <span className="text-gray-300 text-xs">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={addAccount}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors">
                    Connect Account
                  </button>
                  <button onClick={() => setShowAdd(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account cards */}
        <div className="grid grid-cols-1 gap-4">
          {accounts.map((account) => {
            const isSync = syncing === account.id || account.status === 'SYNCING';
            const scoreColor = account.securityScore >= 80 ? 'text-green-400' : account.securityScore >= 60 ? 'text-yellow-400' : 'text-red-400';
            const scoreBg = account.securityScore >= 80 ? 'bg-green-500' : account.securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <div key={account.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-5">
                  {/* Provider icon */}
                  <div className="w-12 h-12 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-400 font-bold text-sm">AWS</span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-white font-semibold">{account.name}</h2>
                          <StatusBadge status={account.status} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="font-mono">{account.accountId}</span>
                          <span>·</span>
                          <span>{account.region}</span>
                          <span>·</span>
                          <span>{account.provider}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => syncAccount(account.id)}
                        disabled={isSync}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-xs px-3 py-1.5 rounded-md transition-colors border border-gray-700"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSync ? 'animate-spin' : ''}`} />
                        {isSync ? 'Syncing...' : 'Sync Now'}
                      </button>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-4 gap-4">
                      {/* Security score */}
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-gray-500 text-xs mb-1">Security Score</div>
                        <div className={`text-2xl font-bold ${scoreColor}`}>{account.securityScore}</div>
                        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${scoreBg}`} style={{ width: `${account.securityScore}%` }} />
                        </div>
                      </div>

                      {/* Resources */}
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                          <Server className="w-3 h-3" /> Resources
                        </div>
                        <div className="text-white text-2xl font-bold">{account.resourceCount}</div>
                      </div>

                      {/* Critical findings */}
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" /> Critical
                        </div>
                        <div className={`text-2xl font-bold ${account.criticalFindings > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {account.criticalFindings}
                        </div>
                      </div>

                      {/* High findings */}
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-orange-400" /> High
                        </div>
                        <div className={`text-2xl font-bold ${account.highFindings > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                          {account.highFindings}
                        </div>
                      </div>
                    </div>

                    {/* Last sync */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>Last synced: {new Date(account.lastSync).toLocaleString()}</span>
                      {account.status === 'CONNECTED' && (
                        <span className="ml-auto flex items-center gap-1 text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services status */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span>Monitored Services:</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {['CloudTrail', 'IAM', 'EC2', 'S3', 'Security Groups', 'RDS'].map((service) => (
                      <span key={service} className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture note */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Security Architecture — AWS Integration
          </h3>
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <div className="text-gray-400 font-medium mb-1">Authentication</div>
              <p>CloudGuard uses IAM Roles with temporary credentials. No long-term access keys are stored.</p>
            </div>
            <div>
              <div className="text-gray-400 font-medium mb-1">Permissions (Least Privilege)</div>
              <p>Read-only permissions: cloudtrail:*, iam:List*, ec2:Describe*, s3:GetBucketAcl, s3:ListAllMyBuckets</p>
            </div>
            <div>
              <div className="text-gray-400 font-medium mb-1">Current Mode</div>
              <p className="text-blue-400">Mock Mode Active — simulating AWS data. Real integration ready for Phase 2.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
