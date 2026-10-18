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
  BookOpen,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alerts', label: 'Alerts', icon: Bell, badge: 16 },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle, badge: 7 },
  { href: '/events', label: 'Security Events', icon: Activity },
  { href: '/cloud-accounts', label: 'Cloud Accounts', icon: Cloud },
  { href: '/iam', label: 'IAM Security', icon: Users },
  { href: '/scanner', label: 'Cloud Scanner', icon: ScanLine },
  { href: '/findings', label: 'Findings', icon: Search },
  { href: '/detection-rules', label: 'Detection Rules', icon: Cpu },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm tracking-wider">CLOUDGUARD</div>
          <div className="text-gray-500 text-xs">Security Operations</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <div className="mb-2 px-2 pt-2">
          <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Main</span>
        </div>
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group mb-0.5',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  item.href === '/alerts' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                )}>
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
            </Link>
          );
        })}

        <div className="mb-2 px-2 pt-4">
          <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Security</span>
        </div>
        {navItems.slice(5, 9).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group mb-0.5',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
            </Link>
          );
        })}

        <div className="mb-2 px-2 pt-4">
          <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Administration</span>
        </div>
        {navItems.slice(9).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group mb-0.5',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-gray-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">SC</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-200 text-xs font-medium truncate">Sarah Chen</div>
            <div className="text-gray-500 text-xs">SOC Analyst</div>
          </div>
          <button className="text-gray-600 hover:text-gray-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 px-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-gray-600 text-xs">System Online</span>
        </div>
      </div>
    </aside>
  );
}
