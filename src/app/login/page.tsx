'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          setError('Invalid username or password');
        } else if (res.status === 423) {
          setError('Account locked');
        } else if (res.status === 403) {
          setError('Request blocked (CSRF/Origin)');
        } else if (res.status >= 500) {
          setError('Server unavailable');
        } else {
          try {
            const data = await res.json();
            setError(data.message || 'Login failed');
          } catch {
            setError('Login failed');
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
      setError('Server unavailable');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CloudGuard SOC</h1>
          <p className="text-gray-500 text-sm mt-1">Security Operations Platform</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your username"
                className="w-full bg-gray-800 text-gray-200 text-sm px-4 py-2.5 rounded-lg border border-gray-700
                  focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
                  placeholder-gray-600 disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  className="w-full bg-gray-800 text-gray-200 text-sm pl-4 pr-10 py-2.5 rounded-lg border border-gray-700
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
                    placeholder-gray-600 disabled:opacity-50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed
                text-white font-semibold text-sm py-2.5 rounded-lg transition-colors
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-6">
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
