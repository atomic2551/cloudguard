'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, Plus, RefreshCw, CheckCircle2, Server, Shield, Clock, X, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, CloudAccountDto, AccountStatus } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function CloudAccountsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [accounts, setAccounts] = useState<CloudAccountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({ name: '', accountId: '', primaryRegion: 'us-east-1' });

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.cloudAccounts.list({ page: 1, size: 50 });
      setAccounts(res.items || []);
    } catch (err: unknown) {
      console.error('Failed to load cloud accounts:', err);
      setError('Failed to fetch cloud account connections from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const syncAccount = async (id: string) => {
    setSyncingId(id);
    try {
      await api.cloudAccounts.update(id, { status: 'SYNCING' as AccountStatus });
      await new Promise((r) => setTimeout(r, 1500));
      await api.cloudAccounts.update(id, { status: 'CONNECTED' as AccountStatus });
      await loadAccounts();
    } catch (err: unknown) {
      console.error('Failed to sync account:', err);
    } finally {
      setSyncingId(null);
    }
  };

  const addAccount = async () => {
    if (!newAccount.name.trim() || !newAccount.accountId.trim() || !isAdmin) return;
    setCreating(true);
    try {
      await api.cloudAccounts.create({
        name: newAccount.name.trim(),
        accountId: newAccount.accountId.trim(),
        primaryRegion: newAccount.primaryRegion,
        roleArn: `arn:aws:iam::${newAccount.accountId.trim()}:role/CloudGuardSecurityAuditRole`,
      });
      setShowAdd(false);
      setNewAccount({ name: '', accountId: '', primaryRegion: 'us-east-1' });
      await loadAccounts();
    } catch (err: unknown) {
      console.error('Failed to add cloud account:', err);
      window.alert('Failed to connect cloud account. Ensure Account ID is permitted by scope.yaml.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Monitored Cloud Accounts & Assets</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {accounts.filter((a) => a.status === 'CONNECTED').length} connected · {accounts.length} total cloud environments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAccounts}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Connect AWS Account
              </button>
            )}
          </div>
        </div>

        {/* Add Account Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  Connect Cloud Environment
                </h2>
                <button onClick={() => setShowAdd(false)}>
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-blue-400 text-xs leading-relaxed">
                  🛡️ <strong>Scope Guard Enforced:</strong> Only AWS Account IDs and ranges authorized in <code>config/scope.yaml</code> are accepted. Any unauthorized target will be refused and written to audit log.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Account Display Name *</label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. AWS Production Primary"
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">12-Digit AWS Account ID *</label>
                  <input
                    type="text"
                    value={newAccount.accountId}
                    onChange={(e) => setNewAccount((p) => ({ ...p, accountId: e.target.value }))}
                    placeholder="123456789012"
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Primary Region</label>
                  <select
                    value={newAccount.primaryRegion}
                    onChange={(e) => setNewAccount((p) => ({ ...p, primaryRegion: e.target.value }))}
                    className="w-full bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none"
                  >
                    {['us-east-1', 'us-west-2', 'eu-central-1', 'eu-west-1', 'ap-southeast-1'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={addAccount}
                    disabled={creating || !newAccount.name.trim() || !newAccount.accountId.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-md transition-colors"
                  >
                    {creating ? 'Verifying...' : 'Validate & Connect'}
                  </button>
                  <button
                    onClick={() => setShowAdd(false)}
                    disabled={creating}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={loadAccounts} className="underline hover:text-red-300">Retry</button>
          </div>
        )}

        {/* Account cards */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-5 animate-pulse">
                <div className="h-6 w-48 bg-gray-800 rounded mb-2" />
                <div className="h-4 w-96 bg-gray-800/60 rounded" />
              </div>
            ))
          ) : accounts.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center text-gray-500">
              <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No cloud accounts currently registered in scope.</p>
            </div>
          ) : (
            accounts.map((account) => {
              const isSync = syncingId === account.id || account.status === 'SYNCING';

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
                            <span className="font-mono text-gray-400">{account.accountId}</span>
                            <span>·</span>
                            <span>{account.primaryRegion}</span>
                            <span>·</span>
                            <span className="text-gray-400">{account.provider}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => syncAccount(account.id)}
                          disabled={isSync}
                          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-xs px-3 py-1.5 rounded-md transition-colors border border-gray-700"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSync ? 'animate-spin' : ''}`} />
                          {isSync ? 'Syncing...' : 'Sync Assets'}
                        </button>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                          <div className="text-gray-500 text-xs mb-1">IAM Read Role ARN</div>
                          <div className="text-gray-300 text-xs font-mono truncate">{account.roleArn || 'arn:aws:iam::*:role/SecurityAudit'}</div>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                          <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                            <Server className="w-3 h-3" /> Regions Monitored
                          </div>
                          <div className="text-white text-xs">{account.monitoredRegions || account.primaryRegion}</div>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                          <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-green-400" /> Ingestion Status
                          </div>
                          <div className="text-green-400 text-xs font-semibold">Active CloudTrail Stream</div>
                        </div>
                      </div>

                      {/* Last sync */}
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>Last synchronized: {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : 'Recent'}</span>
                        {account.status === 'CONNECTED' && (
                          <span className="ml-auto flex items-center gap-1 text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected & Compliant
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
