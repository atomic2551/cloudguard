'use client';

import { useState } from 'react';
import { Bell, Search, Cloud, ChevronDown, AlertCircle, X } from 'lucide-react';

const notifications = [
  { id: '1', text: 'CRITICAL: Privilege Escalation detected', time: '2m ago', severity: 'CRITICAL' },
  { id: '2', text: 'HIGH: Public S3 bucket found', time: '15m ago', severity: 'HIGH' },
  { id: '3', text: 'Brute force attack on AWS Console', time: '32m ago', severity: 'HIGH' },
  { id: '4', text: 'Incident INC-002 status updated', time: '1h ago', severity: 'INFO' },
];

export default function TopBar({ title }: { title?: string }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const unreadCount = 3;

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: title or search */}
      <div className="flex items-center gap-4 flex-1">
        {title && (
          <h1 className="text-white font-semibold text-base">{title}</h1>
        )}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search alerts, incidents, events..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-gray-800 text-gray-300 text-sm pl-9 pr-4 py-1.5 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
          {searchValue && (
            <button onClick={() => setSearchValue('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Right: cloud status, notifications, profile */}
      <div className="flex items-center gap-3">
        {/* Cloud status */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-md px-3 py-1.5 border border-gray-700">
          <Cloud className="w-3.5 h-3.5 text-green-400" />
          <span className="text-gray-300 text-xs font-medium">3 Accounts</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
        </div>

        {/* Alert indicator */}
        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-400 text-xs font-medium">4 Critical</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-md transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-gray-200 text-sm font-medium">Notifications</span>
                <span className="text-xs text-blue-400 cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-gray-700">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-gray-750 cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        n.severity === 'CRITICAL' ? 'bg-red-500' :
                        n.severity === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-gray-300 text-xs">{n.text}</p>
                        <p className="text-gray-600 text-xs mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-700">
                <a href="/alerts" className="text-blue-400 text-xs hover:underline">View all alerts →</a>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <button className="flex items-center gap-2 hover:bg-gray-800 rounded-md px-2 py-1.5 transition-colors">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">SC</span>
          </div>
          <span className="text-gray-300 text-xs font-medium hidden sm:block">Sarah Chen</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </header>
  );
}
