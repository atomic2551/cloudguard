'use client';

import { useState } from 'react';
import { UserPlus, Search, CheckCircle2, XCircle, Shield } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockUsers, type User, type UserRole, type UserStatus } from '@/lib/mock-data';

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
  SOC_ANALYST: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  VIEWER: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const newStatus: UserStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      return { ...u, status: newStatus };
    }));
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">User Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {users.filter(u => u.status === 'ACTIVE').length} active ·{' '}
              {users.filter(u => u.role === 'ADMIN').length} admins ·{' '}
              {users.filter(u => u.role === 'SOC_ANALYST').length} analysts
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Role summary */}
        <div className="grid grid-cols-3 gap-4">
          {([
            { role: 'ADMIN', label: 'Administrators', desc: 'Full platform access' },
            { role: 'SOC_ANALYST', label: 'SOC Analysts', desc: 'Security operations' },
            { role: 'VIEWER', label: 'Viewers', desc: 'Read-only access' },
          ] as { role: UserRole; label: string; desc: string }[]).map(({ role, label, desc }) => {
            const count = users.filter(u => u.role === role).length;
            return (
              <div key={role} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs border rounded px-2 py-0.5 font-medium ${roleColors[role]}`}>{role}</span>
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
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SOC_ANALYST">SOC Analyst</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-md border border-gray-700 focus:outline-none">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>
          <span className="text-gray-600 text-sm ml-auto">{filtered.length} users</span>
        </div>

        {/* Users table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32">Role</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell w-24">MFA</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-36">Department</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell w-36">Last Login</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-800/30 transition-colors ${user.status === 'INACTIVE' ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="text-gray-200 text-sm font-medium">{user.name}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs border rounded px-2 py-0.5 font-medium ${roleColors[user.role]}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {user.mfaEnabled ? (
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
                    <span className="text-gray-500 text-xs">{user.department}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-gray-500 text-xs">{new Date(user.lastLogin).toLocaleDateString()}</div>
                    <div className="text-gray-700 text-xs">{new Date(user.lastLogin).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-blue-400 hover:underline">Edit</button>
                      <span className="text-gray-700">·</span>
                      <button
                        onClick={() => toggleStatus(user.id)}
                        className={`text-xs ${user.status === 'ACTIVE' ? 'text-orange-400 hover:underline' : 'text-green-400 hover:underline'}`}
                      >
                        {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RBAC info */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-gray-200 text-sm font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Role-Based Access Control (RBAC)
          </h2>
          <div className="grid grid-cols-3 gap-4 text-xs">
            {[
              {
                role: 'ADMIN',
                permissions: ['Full dashboard access', 'User management', 'Role assignment', 'Detection rule management', 'Cloud account management', 'System configuration', 'All audit logs'],
              },
              {
                role: 'SOC_ANALYST',
                permissions: ['Security dashboard', 'Alert investigation', 'Incident management', 'Event analysis', 'IAM findings view', 'Scanner results', 'Own audit logs only'],
              },
              {
                role: 'VIEWER',
                permissions: ['Dashboard view only', 'Alert list (read-only)', 'Incident list (read-only)', 'Reports', 'Security score', 'No system access', 'No user management'],
              },
            ].map(({ role, permissions }) => (
              <div key={role} className={`rounded-lg p-3 border ${roleColors[role as UserRole]}`}>
                <div className="font-semibold mb-2">{role}</div>
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
