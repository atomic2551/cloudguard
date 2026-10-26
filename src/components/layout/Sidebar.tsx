'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Bell,
  AlertTriangle,
  Activity,
  Cloud,
  Users,
  ScanLine,
  Search,
  FileText,
  ScrollText,
  Settings,
  LogOut,
  ChevronRight,
  Cpu,
  Server,
  Radio,
  Zap,
  FlaskConical,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/components/AuthProvider';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alerts', label: 'Alerts', icon: Bell, badge: 16 },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle, badge: 2 },
  { href: '/events', label: 'Security Events', icon: Activity },
];

const sensorNavItems = [
  { href: '/hosts', label: 'Hosts & Agents', icon: Server },
  { href: '/network', label: 'Network IDS', icon: Radio },
  { href: '/cloud-accounts', label: 'Cloud Accounts', icon: Cloud },
  { href: '/iam', label: 'IAM Security', icon: Users },
  { href: '/scanner', label: 'Cloud Scanner', icon: ScanLine },
  { href: '/findings', label: 'Findings', icon: Search },
];

const intelligenceNavItems = [
  { href: '/mitre', label: 'ATT&CK Heatmap', icon: Zap },
  { href: '/detection-rules', label: 'Detection Rules', icon: Cpu },
  { href: '/plugins', label: 'Plugins Control', icon: Layers },
  { href: '/simulation', label: 'Simulation Lab', icon: FlaskConical },
];

const adminNavItems = [
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/users', label: 'Users & RBAC', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SC';

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm tracking-wider">SECLAB XDR</div>
          <div className="text-gray-500 text-xs">CloudGuard SOC Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {/* Main Section */}
        <div>
          <div className="px-2 mb-1.5">
            <span className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Operations</span>
          </div>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group mb-0.5',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    item.href === '/alerts' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'
                  )}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
              </Link>
            );
          })}
        </div>

        {/* Sensors & Assets */}
        <div>
          <div className="px-2 mb-1.5">
            <span className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Sensors & Cloud</span>
          </div>
          {sensorNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group mb-0.5',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
              </Link>
            );
          })}
        </div>

        {/* Intelligence & Detection */}
        <div>
          <div className="px-2 mb-1.5">
            <span className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Detection & Lab</span>
          </div>
          {intelligenceNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group mb-0.5',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
              </Link>
            );
          })}
        </div>

        {/* Admin */}
        <div>
          <div className="px-2 mb-1.5">
            <span className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Administration</span>
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group mb-0.5',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-gray-800 p-3 bg-gray-900/80">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-200 text-xs font-medium truncate">{user?.displayName || 'Sarah Chen'}</div>
            <div className="text-gray-500 text-[11px] truncate">{user?.roles?.[0] || 'SOC Analyst'}</div>
          </div>
          <button
            onClick={() => logout()}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-2 text-[10px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Event Bus Live
          </span>
          <span className="font-mono">v1.4.2</span>
        </div>
      </div>
    </aside>
  );
}
