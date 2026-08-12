'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLATSLogo } from '@/components/CLATSLogo';
import { Shield, Key, Mail, Lock, Building, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import { F } from '@/utils/config';
import { useApp } from '@/context/AppContext';

export default function CoordinatorRegisterPage() {
  const router = useRouter();
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [region, setRegion] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !email || !name || !password || !schoolName) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/supabase/b2b/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email, name, password, schoolName, region })
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setSuccess('School activated successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/coordinator/login');
        }, 2000);
      } else {
        setError(data.msg || 'Activation failed. Please check details.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the activation server.');
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
        className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl space-y-6 ${isDark ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-100'}`}
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <CLATSLogo theme={theme} height={36} />
          <h2 className="text-2xl font-black tracking-tight mt-3">Activate School License</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter your license activation code and register your coordinator account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="flex-none mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-start gap-2.5">
            <Sparkles size={16} className="flex-none mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Activation Code *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><Key size={18} /></span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CLATS-ACTIVATE-XXXX"
                className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none text-sm font-semibold transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 focus:border-[#7A6FF0]'}`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                School Name *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400"><Building size={18} /></span>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Lagos Academy"
                  className={`w-full pl-11 pr-3 py-3 rounded-2xl border outline-none text-xs font-semibold transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 focus:border-[#7A6FF0]'}`}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Region / City
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400"><MapPin size={18} /></span>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Austin, TX"
                  className={`w-full pl-11 pr-3 py-3 rounded-2xl border outline-none text-xs font-semibold transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 focus:border-[#7A6FF0]'}`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Coordinator Name *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><Shield size={18} /></span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Principal John"
                className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none text-sm font-semibold transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 focus:border-[#7A6FF0]'}`}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Coordinator Email *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><Mail size={18} /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@school.com"
                className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none text-sm font-semibold transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 focus:border-[#7A6FF0]'}`}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Choose Password *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><Lock size={18} /></span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none text-sm font-semibold transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]' : 'bg-slate-50 border-slate-200 focus:border-[#7A6FF0]'}`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#7A6FF0] hover:bg-[#665ad1] text-white font-extrabold rounded-2xl transition shadow-lg shadow-violet-500/20 text-sm cursor-pointer"
          >
            {loading ? 'Activating...' : 'Activate School License 🚀'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/coordinator/login')}
            className="text-xs text-[#19C6C6] hover:underline font-bold"
          >
            Already registered? Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
