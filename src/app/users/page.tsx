'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus, Search, CheckCircle2, XCircle, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { api, UserDto, UserRole } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
  SOC_ANALYST: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  VIEWER: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.roles?.includes('ADMIN');

  const [users, setUsers] = useState<UserDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('SOC_ANALYST');
  const [department, setDepartment] = useState('SOC Operations');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.users.list({
        page: 1,
        size: 50,
        search: debouncedSearch || undefined,
      });
      setUsers(res.items || []);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      console.error('Failed to load users:', err);
      setError('Failed to fetch platform users from backend.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async () => {
    if (!isAdmin || !username.trim() || !email.trim()) return;
    setCreating(true);
    try {
      await api.users.create({
        username: username.trim(),
        email: email.trim(),
        displayName: displayName.trim() || username.trim(),
        department,
        roles: [role],
      });
      setShowCreate(false);
      setUsername('');
      setEmail('');
      setDisplayName('');
      await loadUsers();
    } catch (err: unknown) {
      console.error('Failed to create user:', err);
      window.alert('Failed to create user. Please check server logs.');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (!isAdmin) {
      window.alert('Only ADMIN users can toggle account statuses.');
      return;
    }
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.users.update(id, { status: newStatus as UserDto['status'] });
      await loadUsers();
    } catch (err: unknown) {
      console.error('Failed to update status:', err);
      window.alert('Failed to update account status.');
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = filterRole === 'ALL' || u.roles.includes(filterRole);
      const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
      return matchRole && matchStatus;
    });
  }, [users, filterRole, filterStatus]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Platform Users & RBAC</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {users.filter((u) => u.status === 'ACTIVE').length} active · {totalElements} total registered users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-600/20"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            )}
          </div>
        </div>

        {/* Create user modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Provision SOC User
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jsmith"
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Display Name *</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jsmith@acmecorp.io"
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Role Assignment</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ADMIN">ADMIN (Full Admin)</option>
                    <option value="SOC_ANALYST">SOC_ANALYST (Operations & Playbooks)</option>
                    <option value="VIEWER">VIEWER (Read-Only)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateUser}
                    disabled={creating || !username.trim() || !email.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-md transition-colors"
                  >
                    {creating ? 'Saving...' : 'Create Account'}
                  </button>
                  <button
                    onClick={() => setShowCreate(false)}
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

        {/* Role summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { role: 'ADMIN', label: 'Administrators', desc: 'Full platform & rule management rights' },
            { role: 'SOC_ANALYST', label: 'SOC Analysts', desc: 'Alert investigation & incident response' },
            { role: 'VIEWER', label: 'Viewers', desc: 'Auditing & read-only reporting access' },
          ].map(({ role: r, label, desc }) => {
            const count = users.filter((u) => u.roles.includes(r)).length;
            return (
              <div key={r} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs border rounded px-2 py-0.5 font-medium ${roleColors[r]}`}>{r}</span>
                </div>
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-gray-400 text-sm">{label}</div>
                <div className="text-gray-600 text-xs mt-0.5">{desc}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SOC_ANALYST">SOC Analyst</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} users</span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={loadUsers} className="underline hover:text-red-300">Retry</button>
          </div>
        )}

        {/* Users table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36">Role</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell w-24">MFA</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-36">Department</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-36">Last Login</th>
                {isAdmin && <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-16 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                    {isAdmin && <td className="px-4 py-3"></td>}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-gray-600">
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-800/30 transition-colors ${u.status === 'INACTIVE' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {u.displayName ? u.displayName.charAt(0) : 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-gray-200 text-sm font-medium">{u.displayName}</div>
                          <div className="text-gray-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r) => (
                          <span key={r} className={`text-xs border rounded px-2 py-0.5 font-medium ${roleColors[r] ?? 'bg-gray-800 text-gray-400'}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.mfaEnabled ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs">{u.department || 'SOC'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-gray-400 text-xs">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(u.id, u.status)}
                          className={`text-xs ${u.status === 'ACTIVE' ? 'text-orange-400 hover:underline' : 'text-green-400 hover:underline'}`}
                        >
                          {u.status === 'ACTIVE' ? 'Lock Account' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RBAC Info Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-gray-200 text-sm font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Role-Based Access Control (RBAC) Hierarchy
          </h2>
          <div className="grid grid-cols-3 gap-4 text-xs">
            {[
              {
                role: 'ADMIN',
                permissions: ['Full platform access', 'User management & RBAC', 'Detection rules configuration', 'Cloud account provisioning', 'All audit logs'],
              },
              {
                role: 'SOC_ANALYST',
                permissions: ['Incident investigation & SOAR', 'Alert triage & status update', 'Security findings remediation', 'Scanner operations'],
              },
              {
                role: 'VIEWER',
                permissions: ['Read-only dashboard view', 'Read-only alert list', 'Read-only incidents', 'Executive compliance reports'],
              },
            ].map(({ role: r, permissions }) => (
              <div key={r} className={`rounded-lg p-3 border ${roleColors[r]}`}>
                <div className="font-semibold mb-2">{r}</div>
                <ul className="space-y-1">
                  {permissions.map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0 opacity-60"></div>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
