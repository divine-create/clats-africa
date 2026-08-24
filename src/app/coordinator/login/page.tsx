'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { CLATSLogo } from '@/components/CLATSLogo';
import { Shield, Key, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { F } from '@/utils/config';

export default function CoordinatorLoginPage() {
  const router = useRouter();
  const { setParent, theme } = useApp();
  const isDark = theme === 'dark';

  const [loginMode, setLoginMode] = useState<'code' | 'email'>('code');

  // Code login states
  const [code, setCode] = useState('');

  // Email login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter your school or organization access code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/supabase/b2b/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        // Authenticated as coordinator/sponsor
        const b2bParent = {
          id: Date.now().toString(),
          email: `b2b_${code.trim().toLowerCase()}@clats.local`,
          name: 'School Coordinator',
          children: [],
          isB2B: true
        };

        localStorage.setItem('cl_b2b_org_id', data.org_id);
        localStorage.setItem('clats_sess_v1', JSON.stringify({ type: 'parent', email: b2bParent.email, isB2B: true }));

        setParent(b2bParent);
        router.push('/coordinator/dashboard');
      } else {
        setError(data.msg || 'Invalid or unrecognized access code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/supabase/b2b/coordinator-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        localStorage.setItem('cl_b2b_org_id', data.org_id);
        localStorage.setItem('clats_sess_v1', JSON.stringify({ type: 'parent', email: data.parent.email, isB2B: true }));

        setParent({ ...data.parent, id: data.parent.id || data.org_id });
        router.push('/coordinator/dashboard');
      } else {
        setError(data.msg || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? '#0F172A' : '#F8FAFC',
        color: isDark ? '#F8FAFC' : '#1E293B',
        fontFamily: F.body,
        padding: '24px'
      }}
    >
      <div
        className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl space-y-5 ${isDark ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-100'}`}
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <CLATSLogo theme={theme} height={36} />
          <h2 className="text-2xl font-black tracking-tight mt-3 font-sans">Coordinator Portal</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Sign in to track syllabus completion and impact analytics.
          </p>
        </div>

        {/* ── MODE SWITCHER TABS ── */}
        <div style={{ display: 'flex', background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderRadius: 14, padding: 4, gap: 4 }}>
          {([['code', '🔑 Access Code'], ['email', '✉️ Coordinator Sign In']] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setLoginMode(mode); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl border-none font-bold text-xs cursor-pointer transition ${loginMode === mode ? 'bg-[#7A6FF0] text-white shadow-md shadow-violet-500/20' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="flex-none mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── ACCESS CODE LOGIN FORM ── */}
        {loginMode === 'code' && (
          <form onSubmit={handleCodeLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Access Code
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <Key size={18} />
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CLATS-LAGOS-2026"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none font-bold font-mono text-sm tracking-wider transition ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 text-slate-850 focus:border-[#7A6FF0]'}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#7A6FF0] hover:bg-[#665ad1] text-white font-extrabold rounded-2xl transition shadow-lg shadow-indigo-500/20 cursor-pointer text-sm"
            >
              {loading ? 'Validating credentials...' : 'Enter Dashboard 🔑'}
            </button>
          </form>
        )}

        {/* ── EMAIL & PASSWORD LOGIN FORM ── */}
        {loginMode === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coordinator@school.com"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none text-sm font-semibold transition ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 text-slate-850 focus:border-[#7A6FF0]'}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none text-sm font-semibold transition ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 text-slate-850 focus:border-[#7A6FF0]'}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#7A6FF0] hover:bg-[#665ad1] text-white font-extrabold rounded-2xl transition shadow-lg shadow-indigo-500/20 cursor-pointer text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In ✉️'}
            </button>
          </form>
        )}

        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            onClick={() => router.push('/coordinator/register')}
            className="text-xs text-[#19C6C6] hover:underline font-bold"
          >
            Register School / Activate License 🚀
          </button>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Adopted by Ministry of Education & NGO CSR Initiatives
          </p>
        </div>
      </div>
    </div>
  );
}
