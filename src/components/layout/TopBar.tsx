'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, Cloud, ChevronDown, AlertCircle, X, LogOut, Menu, Globe } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/lib/i18n';

const notifications = [
  { id: '1', text: 'CRITICAL: Privilege Escalation detected', time: '2m ago', severity: 'CRITICAL' },
  { id: '2', text: 'HIGH: Public S3 bucket found', time: '15m ago', severity: 'HIGH' },
  { id: '3', text: 'Brute force attack on AWS Console', time: '32m ago', severity: 'HIGH' },
  { id: '4', text: 'Incident INC-002 status updated', time: '1h ago', severity: 'INFO' },
];

export default function TopBar({ title, onMenuToggle }: { title?: string; onMenuToggle?: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const unreadCount = 3;

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SC';

  return (
    <header className="h-14 flex-shrink-0 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30" role="banner">
      {/* Left: hamburger + title + search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors lg:hidden active:bg-gray-700"
          aria-label="Toggle sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-white font-semibold text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">{title}</h1>
        )}
        <div className="relative max-w-xs w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            id="topbar-search"
            type="text"
            placeholder={t('topbar.search_placeholder')}
            aria-label="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-1.5 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
          {searchValue && (
            <button onClick={() => setSearchValue('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Right: language switcher, cloud status, notifications, profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Language Switcher Button */}
        <div className="relative">
          <button
            onClick={() => { setShowLangMenu(!showLangMenu); setShowUserMenu(false); setShowNotifications(false); }}
            className="flex items-center gap-1.5 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            aria-label="Switch language"
            title={t('topbar.switch_lang')}
          >
            <span className="text-sm">{language === 'uz' ? '🇺🇿' : '🇬🇧'}</span>
            <span className="tracking-wide">{language === 'uz' ? 'UZ' : 'EN'}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-10 w-36 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl py-1 z-50">
              <button
                onClick={() => { setLanguage('uz'); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors ${
                  language === 'uz' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span>🇺🇿</span>
                <span>O&apos;zbekcha</span>
              </button>
              <button
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors ${
                  language === 'en' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          )}
        </div>

        {/* Cloud status - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2 bg-gray-800 rounded-md px-3 py-1.5 border border-gray-700">
          <Cloud className="w-3.5 h-3.5 text-green-400" />
          <span className="text-gray-300 text-xs font-medium">3 {t('topbar.accounts')}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
        </div>

        {/* Alert indicator - hidden on small mobile */}
        <Link
          href="/alerts"
          className="hidden sm:flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-md px-2.5 py-1.5 hover:bg-red-500/20 transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-400 text-xs font-medium">4 {t('topbar.critical')}</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); setShowLangMenu(false); }}
            className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-72 sm:w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="text-gray-200 text-sm font-semibold">{t('topbar.notifications')}</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-blue-400 cursor-pointer hover:underline"
                >
                  ✓
                </button>
              </div>
              <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-2.5 hover:bg-gray-800/60 cursor-pointer transition-colors">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        n.severity === 'CRITICAL' ? 'bg-red-500' :
                        n.severity === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 text-xs font-medium leading-tight">{n.text}</p>
                        <p className="text-gray-500 text-[11px] mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-800 bg-gray-900/50 rounded-b-xl">
                <Link href="/alerts" className="text-blue-400 text-xs hover:underline block text-center" onClick={() => setShowNotifications(false)}>
                  {t('dashboard.view_all')} →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); setShowLangMenu(false); }}
            className="flex items-center gap-1.5 sm:gap-2 hover:bg-gray-800 rounded-lg p-1 sm:px-2 sm:py-1.5 transition-colors cursor-pointer"
            aria-label="Open user menu"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/90 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30">
              {initials}
            </div>
            <span className="text-gray-200 text-xs font-semibold hidden md:block max-w-[120px] truncate">
              {user?.displayName || 'User'}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-500 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 py-1">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-gray-100 text-sm font-semibold truncate">{user?.displayName}</p>
                <p className="text-gray-500 text-xs truncate mt-0.5">{user?.email}</p>
                {user?.roles && (
                  <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    {user.roles[0]}
                  </span>
                )}
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
