'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertCircle, Loader2, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

function sanitizeRedirect(target: string | null | undefined): string {
  if (!target) return '/dashboard';
  // Must start with a single "/" and not "//" or "/\"
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return '/dashboard';
  }
  // Must contain no scheme (no colon or protocol like https:)
  if (target.includes(':') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) {
    return '/dashboard';
  }
  return target;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = sanitizeRedirect(searchParams.get('from'));
  const { language, setLanguage, t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('login.err_empty'));
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError(t('login.err_invalid'));
        } else if (res.status === 423) {
          setError(t('login.err_locked'));
        } else if (res.status === 403) {
          setError('CSRF / Origin cheklovi');
        } else if (res.status >= 500) {
          setError(t('login.err_server'));
        } else {
          try {
            const data = await res.json();
            setError(data.message || t('login.err_invalid'));
          } catch {
            setError(t('login.err_invalid'));
          }
        }
        return;
      }

      // Bootstrap CSRF token cookie
      try {
        await fetch('/api/auth/csrf', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
      } catch {
        // ignore
      }

      // Cookie is set by the server (cg_token); just redirect
      router.push(from);
      router.refresh();
    } catch {
      setError(t('login.err_server'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="w-full max-w-sm flex justify-end mb-4">
        <div className="inline-flex bg-gray-900 border border-gray-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLanguage('uz')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              language === 'uz' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            🇺🇿 O&apos;zbekcha
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-600/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CloudGuard SOC</h1>
          <p className="text-gray-400 text-xs mt-1">{t('login.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">{t('login.signin_title')}</h2>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-gray-300 text-xs font-medium mb-1.5">
                {t('login.username')}
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder={t('login.username_placeholder')}
                className="w-full bg-gray-800/90 text-gray-100 text-sm px-4 py-3 rounded-xl border border-gray-700
                  focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
                  placeholder-gray-500 disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-300 text-xs font-medium mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={t('login.password_placeholder')}
                  className="w-full bg-gray-800/90 text-gray-100 text-sm pl-4 pr-11 py-3 rounded-xl border border-gray-700
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
                    placeholder-gray-500 disabled:opacity-50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed
                text-white font-semibold text-sm py-3 rounded-xl transition-all cursor-pointer
                flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 select-none touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('login.signing_in')}
                </>
              ) : (
                t('login.signin_btn')
              )}
            </button>
          </form>

          {/* Quick 1-tap demo credentials fill */}
          <div className="mt-5 pt-4 border-t border-gray-800/80">
            <p className="text-[11px] text-gray-500 text-center mb-2.5 font-medium">
              ⚡️ {language === 'uz' ? 'Tezkor to\'ldirish (1 ta bosishda):' : 'Quick fill demo user:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername('sarah.chen');
                  setPassword('CloudGuard2026!');
                  setError('');
                }}
                className="flex items-center justify-center gap-2 bg-gray-800/60 hover:bg-gray-800 active:bg-blue-600/20 border border-gray-700/60 hover:border-blue-500/50 rounded-xl py-2 px-2.5 transition-all cursor-pointer group shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                <span className="text-gray-300 group-hover:text-white text-xs font-semibold truncate">
                  Admin (sarah)
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('alex.rivera');
                  setPassword('CloudGuard2026!');
                  setError('');
                }}
                className="flex items-center justify-center gap-2 bg-gray-800/60 hover:bg-gray-800 active:bg-purple-600/20 border border-gray-700/60 hover:border-purple-500/50 rounded-xl py-2 px-2.5 transition-all cursor-pointer group shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 group-hover:scale-125 transition-transform"></span>
                <span className="text-gray-300 group-hover:text-white text-xs font-semibold truncate">
                  Analyst (alex)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          CloudGuard SOC Platform · SecLab XDR
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
