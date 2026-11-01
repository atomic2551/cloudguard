'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bell, AlertTriangle, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useLanguage } from '@/lib/i18n';

export default function AppLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="flex h-screen w-screen bg-gray-950 overflow-hidden">
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-14 lg:pb-0">
        <TopBar title={title} onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto bg-gray-950">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (App-like experience on phones) */}
      <nav aria-label="Mobile quick navigation" className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 flex items-center justify-around px-2 z-30">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/dashboard' ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="truncate max-w-[70px]">{t('nav.dashboard')}</span>
        </Link>
        <Link
          href="/alerts"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            pathname.startsWith('/alerts') ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Bell className="w-5 h-5 mb-0.5" />
          <span className="truncate max-w-[70px]">{t('nav.alerts')}</span>
        </Link>
        <Link
          href="/incidents"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            pathname.startsWith('/incidents') ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mb-0.5" />
          <span className="truncate max-w-[70px]">{t('nav.incidents')}</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-200 cursor-pointer active:text-white"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>{t('common.all')}</span>
        </button>
      </nav>
    </div>
  );
}
