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
  X,
  Globe,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/lib/i18n';

const mainNavItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/alerts', labelKey: 'nav.alerts', icon: Bell },
  { href: '/incidents', labelKey: 'nav.incidents', icon: AlertTriangle },
  { href: '/events', labelKey: 'nav.events', icon: Activity },
];

const sensorNavItems = [
  { href: '/hosts', labelKey: 'nav.hosts', icon: Server },
  { href: '/network', labelKey: 'nav.network', icon: Radio },
  { href: '/cloud-accounts', labelKey: 'nav.cloud_accounts', icon: Cloud },
  { href: '/iam', labelKey: 'nav.iam', icon: Users },
  { href: '/scanner', labelKey: 'nav.scanner', icon: ScanLine },
  { href: '/findings', labelKey: 'nav.findings', icon: Search },
];

const intelligenceNavItems = [
  { href: '/mitre', labelKey: 'nav.mitre', icon: Zap },
  { href: '/detection-rules', labelKey: 'nav.detection_rules', icon: Cpu },
  { href: '/plugins', labelKey: 'nav.plugins', icon: Layers },
  { href: '/simulation', labelKey: 'nav.simulation', icon: FlaskConical },
];

const adminNavItems = [
  { href: '/reports', labelKey: 'nav.reports', icon: FileText },
  { href: '/audit-logs', labelKey: 'nav.audit_logs', icon: ScrollText },
  { href: '/users', labelKey: 'nav.users', icon: Users },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SC';

  return (
    <aside
      aria-label="Main navigation"
      className={clsx(
        'w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen flex-shrink-0 z-50 lg:z-auto transition-transform duration-200',
        'fixed lg:static left-0 top-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wider">SECLAB XDR</div>
            <div className="text-gray-500 text-xs">CloudGuard SOC Platform</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Sidebar navigation" className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {/* Main Section */}
        <div>
          <div className="px-2 mb-1.5">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{t('nav.operations')}</span>
          </div>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group mb-0.5 active:bg-gray-800',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
                <span className="flex-1">{t(item.labelKey)}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
              </Link>
            );
          })}
        </div>

        {/* Sensors & Assets */}
        <div>
          <div className="px-2 mb-1.5">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{t('nav.sensors')}</span>
          </div>
          {sensorNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group mb-0.5 active:bg-gray-800',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
                <span className="flex-1">{t(item.labelKey)}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
              </Link>
            );
          })}
        </div>

        {/* Intelligence & Detection */}
        <div>
          <div className="px-2 mb-1.5">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{t('nav.detection')}</span>
          </div>
          {intelligenceNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group mb-0.5 active:bg-gray-800',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
                <span className="flex-1">{t(item.labelKey)}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
              </Link>
            );
          })}
        </div>

        {/* Admin */}
        <div>
          <div className="px-2 mb-1.5">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{t('nav.admin')}</span>
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group mb-0.5 active:bg-gray-800',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400')} />
                <span className="flex-1">{t(item.labelKey)}</span>
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
            title={t('nav.logout')}
            aria-label={t('nav.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Language switcher pills */}
        <div className="flex items-center gap-1.5 px-2 mt-2 pt-2 border-t border-gray-800/60">
          <Globe className="w-3.5 h-3.5 text-gray-500" />
          <button
            onClick={() => setLanguage('uz')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              language === 'uz' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            🇺🇿 O&apos;zbekcha
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            🇬🇧 English
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-2 text-[10px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Event Bus Live
          </span>
          <span className="font-mono">SecLab XDR</span>
        </div>
      </div>
    </aside>
  );
}
